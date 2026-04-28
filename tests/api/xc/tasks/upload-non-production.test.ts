import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks (non-production env: validations should be skipped) ────

vi.mock("@/env", () => ({
	env: { VLM_ENV: "development" },
}));

vi.mock("@/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("next/headers", () => ({
	headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		xcEnrollment: { findUnique: vi.fn() },
		xcTrackSubmission: {
			findFirst: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		},
	},
}));

vi.mock("@/lib/r2", () => ({
	buildObjectKey: vi.fn(
		({ year, userId, taskId, fileName }) =>
			`xc/${year}/${userId}/${taskId}/${fileName}`,
	),
	uploadObject: vi.fn(),
	deleteObject: vi.fn(),
}));

vi.mock("@/actions/xc/getXcTaskById", () => ({
	default: vi.fn(),
}));

vi.mock("@/lib/igc-parser", () => ({
	parseIGC: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import getXcTaskById from "@/actions/xc/getXcTaskById";
import { POST } from "@/app/api/xc/tasks/[id]/upload/route";
import { auth } from "@/auth";
import { parseIGC } from "@/lib/igc-parser";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/r2";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
	typeof vi.fn
>;
const mockGetXcTaskById = getXcTaskById as unknown as ReturnType<typeof vi.fn>;
const mockParseIGC = parseIGC as unknown as ReturnType<typeof vi.fn>;
const mockUploadObject = uploadObject as unknown as ReturnType<typeof vi.fn>;
const mockPrisma = prisma as unknown as {
	xcEnrollment: { findUnique: ReturnType<typeof vi.fn> };
	xcTrackSubmission: {
		findFirst: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
};

const USER_ID = "user-1";
const TASK_ID = "task-1";
const EDITION_ID = 2026;

const baseTask = {
	id: TASK_ID,
	slug: "task-slug",
	name: "Test Task",
	points: 100,
	category: "BASIC" as const,
	distanceKm: 10,
};

function makeRequest() {
	const formData = new FormData();
	formData.append(
		"file",
		new File(["any-content"], "track.igc", {
			type: "application/octet-stream",
		}),
	);
	return new Request(`http://localhost/api/xc/tasks/${TASK_ID}/upload`, {
		method: "POST",
		body: formData,
	});
}

beforeEach(() => {
	vi.resetAllMocks();
});

describe("POST /xc/tasks/[id]/upload (non-production)", () => {
	it("skips IGC parsing and duplicate checksum checks", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcEnrollment.findUnique.mockResolvedValue({
			userId: USER_ID,
			editionId: EDITION_ID,
		});
		mockGetXcTaskById.mockResolvedValue(baseTask);
		mockUploadObject.mockResolvedValue(undefined);
		mockPrisma.xcTrackSubmission.findFirst.mockResolvedValue(null);
		mockPrisma.xcTrackSubmission.create.mockResolvedValue({ id: "sub-new" });

		const res = await POST(makeRequest(), {
			params: Promise.resolve({ id: TASK_ID }),
		});

		expect(res.status).toBe(200);
		expect(mockParseIGC).not.toHaveBeenCalled();
		expect(mockUploadObject).toHaveBeenCalledOnce();
	});

	it("accepts a file even with an out-of-window flight date when not in production", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcEnrollment.findUnique.mockResolvedValue({
			userId: USER_ID,
			editionId: EDITION_ID,
		});
		mockGetXcTaskById.mockResolvedValue(baseTask);
		mockParseIGC.mockReturnValue({
			header: {
				date: "1999-01-01",
				pilot: null,
				gliderType: null,
				registration: null,
				site: null,
			},
			fixes: [],
			stats: {} as never,
		});
		mockUploadObject.mockResolvedValue(undefined);
		mockPrisma.xcTrackSubmission.findFirst.mockResolvedValue(null);
		mockPrisma.xcTrackSubmission.create.mockResolvedValue({ id: "sub-new" });

		const res1 = await POST(makeRequest(), {
			params: Promise.resolve({ id: TASK_ID }),
		});

		expect(res1.status).toBe(200);

		const res2 = await POST(makeRequest(), {
			params: Promise.resolve({ id: TASK_ID }),
		});

		expect(res2.status).toBe(200);
	});
});
