import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────

vi.mock("@/env", () => ({
	env: { VLM_ENV: "production" },
}));

vi.mock("@/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("next/headers", () => ({
	headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		xcEnrollment: {
			findUnique: vi.fn(),
		},
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
// Import mocked modules to set up return values
import { POST } from "@/app/api/xc/tasks/[id]/upload/route";
import { auth } from "@/auth";
import { parseIGC } from "@/lib/igc-parser";
import { prisma } from "@/lib/prisma";
import { deleteObject, uploadObject } from "@/lib/r2";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
	typeof vi.fn
>;
const mockGetXcTaskById = getXcTaskById as unknown as ReturnType<typeof vi.fn>;
const mockParseIGC = parseIGC as unknown as ReturnType<typeof vi.fn>;
const mockUploadObject = uploadObject as unknown as ReturnType<typeof vi.fn>;
const mockDeleteObject = deleteObject as unknown as ReturnType<typeof vi.fn>;
const mockPrisma = prisma as unknown as {
	xcEnrollment: { findUnique: ReturnType<typeof vi.fn> };
	xcTrackSubmission: {
		findFirst: ReturnType<typeof vi.fn>;
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
};

// ── Helpers ──────────────────────────────────────────────

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
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

const baseEnrollment = {
	userId: USER_ID,
	editionId: EDITION_ID,
};

const validParsed = {
	header: {
		date: "2026-04-15",
		pilot: "Mario",
		gliderType: null,
		registration: null,
		site: null,
	},
	fixes: [],
	stats: {
		durationSeconds: 0,
		duration: "00:00:00",
		maxAltitude: 0,
		minAltitude: 0,
		totalDistanceKm: 0,
		startTime: null,
		endTime: null,
		fixCount: 0,
	},
};

function makeRequest({
	fileName = "track.igc",
	content = "HFDTE150426\n",
}: {
	fileName?: string;
	content?: string;
} = {}) {
	const formData = new FormData();
	const file = new File([content], fileName, {
		type: "application/octet-stream",
	});
	formData.append("file", file);
	return new Request(`http://localhost/api/xc/tasks/${TASK_ID}/upload`, {
		method: "POST",
		body: formData,
	});
}

function makeContext(id = TASK_ID) {
	return { params: Promise.resolve({ id }) };
}

function setupHappyPath() {
	mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
	mockPrisma.xcEnrollment.findUnique.mockResolvedValue(baseEnrollment);
	mockGetXcTaskById.mockResolvedValue(baseTask);
	mockParseIGC.mockReturnValue(validParsed);
	mockPrisma.xcTrackSubmission.findFirst.mockResolvedValue(null);
	mockUploadObject.mockResolvedValue(undefined);
}

// ── Tests ────────────────────────────────────────────────

beforeEach(() => {
	vi.resetAllMocks();
});

describe("POST /xc/tasks/[id]/upload (production)", () => {
	// ─── Auth ────────────────────────────────────────────

	it("returns 401 when not authenticated", async () => {
		mockGetSession.mockResolvedValue(null);

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(401);
		expect(body.error).toBe("Unauthorized");
	});

	// ─── Enrollment ──────────────────────────────────────

	it("returns 403 when user is not enrolled in edition", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcEnrollment.findUnique.mockResolvedValue(null);

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(403);
		expect(body.error).toBe("Not enrolled in XC edition");
	});

	// ─── Task not found ──────────────────────────────────

	it("returns 404 when task does not exist", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcEnrollment.findUnique.mockResolvedValue(baseEnrollment);
		mockGetXcTaskById.mockResolvedValue(null);

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body.error).toBe("Task not found");
	});

	// ─── Missing file ────────────────────────────────────

	it("returns 400 when no file is provided", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcEnrollment.findUnique.mockResolvedValue(baseEnrollment);
		mockGetXcTaskById.mockResolvedValue(baseTask);

		const formData = new FormData();
		const req = new Request(`http://localhost/api/xc/tasks/${TASK_ID}/upload`, {
			method: "POST",
			body: formData,
		});

		const res = await POST(req, makeContext());
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toBe("No file provided");
	});

	// ─── Wrong extension ─────────────────────────────────

	it("returns 400 when file extension is not .igc", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcEnrollment.findUnique.mockResolvedValue(baseEnrollment);
		mockGetXcTaskById.mockResolvedValue(baseTask);

		const res = await POST(
			makeRequest({ fileName: "track.txt" }),
			makeContext(),
		);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toBe("Only .igc files are allowed");
	});

	// ─── IGC date validation ─────────────────────────────

	it("returns 400 when IGC parser throws", async () => {
		setupHappyPath();
		mockParseIGC.mockImplementation(() => {
			throw new Error("invalid IGC");
		});

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toMatch(/Data del volo non valida/);
		expect(mockUploadObject).not.toHaveBeenCalled();
	});

	it("returns 400 when IGC header date is null", async () => {
		setupHappyPath();
		mockParseIGC.mockReturnValue({
			...validParsed,
			header: { ...validParsed.header, date: null },
		});

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toMatch(/Data del volo non valida/);
	});

	it("returns 400 when flight date is before the edition window", async () => {
		setupHappyPath();
		mockParseIGC.mockReturnValue({
			...validParsed,
			header: { ...validParsed.header, date: "2025-09-30" }, // 1 day before window
		});

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toMatch(/Data del volo non valida/);
		expect(mockUploadObject).not.toHaveBeenCalled();
	});

	it("returns 400 when flight date is after the edition window", async () => {
		setupHappyPath();
		mockParseIGC.mockReturnValue({
			...validParsed,
			header: { ...validParsed.header, date: "2026-10-01" }, // 1 day after window
		});

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toMatch(/Data del volo non valida/);
		expect(mockUploadObject).not.toHaveBeenCalled();
	});

	it("accepts flight date at the start boundary (Oct 1, NEXT_YEAR-1)", async () => {
		setupHappyPath();
		mockParseIGC.mockReturnValue({
			...validParsed,
			header: { ...validParsed.header, date: "2025-10-01" },
		});
		mockPrisma.xcTrackSubmission.create.mockResolvedValue({ id: "sub-new" });

		const res = await POST(makeRequest(), makeContext());

		expect(res.status).toBe(200);
		expect(mockUploadObject).toHaveBeenCalledOnce();
	});

	it("accepts flight date at the end boundary (Sep 30, NEXT_YEAR)", async () => {
		setupHappyPath();
		mockParseIGC.mockReturnValue({
			...validParsed,
			header: { ...validParsed.header, date: "2026-09-30" },
		});
		mockPrisma.xcTrackSubmission.create.mockResolvedValue({ id: "sub-new" });

		const res = await POST(makeRequest(), makeContext());

		expect(res.status).toBe(200);
		expect(mockUploadObject).toHaveBeenCalledOnce();
	});

	// ─── Duplicate checksum ──────────────────────────────

	it("returns 409 when checksum matches another user's track", async () => {
		setupHappyPath();
		mockPrisma.xcTrackSubmission.findFirst.mockResolvedValueOnce({
			id: "dup",
			userId: OTHER_USER_ID,
			taskId: "task-other",
			user: { firstName: "Luigi", lastName: "Verdi" },
			task: { name: "Other Task" },
		});

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(409);
		expect(body.error).toContain("Luigi Verdi");
		expect(body.error).toMatch(/già attribuita al pilota/);
		expect(mockUploadObject).not.toHaveBeenCalled();
	});

	it("returns 409 when checksum matches the same user's track on another task", async () => {
		setupHappyPath();
		mockPrisma.xcTrackSubmission.findFirst.mockResolvedValueOnce({
			id: "dup",
			userId: USER_ID,
			taskId: "task-other",
			user: { firstName: "Mario", lastName: "Rossi" },
			task: { name: "Other Task" },
		});

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(409);
		expect(body.error).toContain("Other Task");
		expect(body.error).toMatch(/già in uso per/);
		expect(mockUploadObject).not.toHaveBeenCalled();
	});

	// ─── Successful upload (new submission) ──────────────

	it("creates a new submission when none exists", async () => {
		setupHappyPath();
		mockPrisma.xcTrackSubmission.create.mockResolvedValue({ id: "sub-new" });

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.submissionId).toBe("sub-new");
		expect(mockUploadObject).toHaveBeenCalledOnce();
		expect(mockPrisma.xcTrackSubmission.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					userId: USER_ID,
					editionId: EDITION_ID,
					taskId: TASK_ID,
					checksum: expect.any(String),
				}),
			}),
		);
	});

	// ─── Successful upload (replace existing submission) ─

	it("replaces an existing submission and deletes old R2 object", async () => {
		setupHappyPath();
		const existingSub = {
			id: "sub-existing",
			fileName: "old-key.igc",
		};
		// First findFirst call → duplicate check (none); second → existing-submission lookup
		mockPrisma.xcTrackSubmission.findFirst
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(existingSub);
		mockPrisma.xcTrackSubmission.update.mockResolvedValue({
			id: "sub-existing",
		});
		mockDeleteObject.mockResolvedValue(undefined);

		const res = await POST(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.submissionId).toBe("sub-existing");
		expect(mockDeleteObject).toHaveBeenCalledWith("old-key.igc");
		expect(mockPrisma.xcTrackSubmission.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "sub-existing" },
				data: expect.objectContaining({ status: "PENDING" }),
			}),
		);
		expect(mockPrisma.xcTrackSubmission.create).not.toHaveBeenCalled();
	});

	// ─── Replace existing: R2 delete failure must not block ─

	it("still updates the submission when deleting old R2 object fails", async () => {
		setupHappyPath();
		mockPrisma.xcTrackSubmission.findFirst
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: "sub-existing", fileName: "old-key.igc" });
		mockPrisma.xcTrackSubmission.update.mockResolvedValue({
			id: "sub-existing",
		});
		mockDeleteObject.mockRejectedValue(new Error("R2 down"));
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await POST(makeRequest(), makeContext());

		expect(res.status).toBe(200);
		expect(mockPrisma.xcTrackSubmission.update).toHaveBeenCalled();

		consoleSpy.mockRestore();
		expect(mockPrisma.xcTrackSubmission.update).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});
});
