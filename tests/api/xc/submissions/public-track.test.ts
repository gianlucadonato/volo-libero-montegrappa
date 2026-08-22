import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/xc/submissions/[id]/route";

// ── Mocks ────────────────────────────────────────────────

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
		xcTrackSubmission: {
			findUnique: vi.fn(),
			delete: vi.fn(),
			aggregate: vi.fn(),
			findMany: vi.fn(),
		},
		xcProgress: {
			findUnique: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		xcEdition: {
			findUniqueOrThrow: vi.fn(),
		},
	},
}));

vi.mock("@/lib/r2", () => ({
	downloadObject: vi.fn(),
	deleteObject: vi.fn(),
}));

vi.mock("@/lib/igc-parser", () => ({
	parseIGC: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Import mocked modules to set up return values
import { auth } from "@/auth";
import { parseIGC } from "@/lib/igc-parser";
import { prisma } from "@/lib/prisma";
import { downloadObject } from "@/lib/r2";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
	typeof vi.fn
>;
const mockDownloadObject = downloadObject as unknown as ReturnType<
	typeof vi.fn
>;
const mockParseIGC = parseIGC as unknown as ReturnType<typeof vi.fn>;
const mockPrisma = prisma as unknown as {
	xcTrackSubmission: { findUnique: ReturnType<typeof vi.fn> };
};

// ── Helpers ──────────────────────────────────────────────

const USER_ID = "user-1";
const OTHER_USER_ID = "user-other";

function makeRequest() {
	return new Request("http://localhost/api/xc/submissions/sub-1");
}

function makeContext(id = "sub-1") {
	return { params: Promise.resolve({ id }) };
}

const parsed = {
	header: {
		date: "2026-04-01",
		pilot: "Mario Rossi",
		gliderType: null,
		registration: null,
		site: null,
	},
	stats: {
		durationSeconds: 5400,
		duration: "01:30:00",
		maxAltitude: 1800,
		minAltitude: 400,
		totalDistanceKm: 42.3,
		startTime: "10:00:00",
		endTime: "11:30:00",
		fixCount: 2,
	},
	fixes: [
		{
			timestamp: 1,
			time: "10:00:00",
			latitude: 45.8,
			longitude: 11.7,
			valid: true,
			pressureAltitude: 800,
			gpsAltitude: 810,
		},
	],
};

const baseSubmission = {
	id: "sub-1",
	userId: USER_ID,
	editionId: 2026,
	taskId: "task-1",
	status: "APPROVED" as const,
	fileName: "uploads/2026/user-1/task-1/track.igc",
	flightData: null,
};

function mockTrack(status: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED") {
	mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue({
		...baseSubmission,
		status,
	});
	mockDownloadObject.mockResolvedValue("igc file content");
	mockParseIGC.mockReturnValue(parsed);
}

// ── Tests ────────────────────────────────────────────────

beforeEach(() => {
	vi.resetAllMocks();
});

describe("GET /xc/submissions/[id]", () => {
	// ─── Approved tracks are public ──────────────────────

	it("returns an APPROVED track without a session", async () => {
		mockTrack("APPROVED");

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(mockGetSession).not.toHaveBeenCalled();
		expect(body.submissionId).toBe("sub-1");
		expect(body.status).toBe("APPROVED");
		expect(body.stats.totalDistanceKm).toBe(42.3);
		expect(body.fixes).toHaveLength(1);
	});

	it("caches APPROVED tracks", async () => {
		mockTrack("APPROVED");

		const res = await GET(makeRequest(), makeContext());

		expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
	});

	// ─── Pending and rejected stay private ───────────────

	it("returns 401 for a PENDING track without a session", async () => {
		mockTrack("PENDING");
		mockGetSession.mockResolvedValue(null);

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(401);
		expect(body.error).toBe("Unauthorized");
		expect(mockDownloadObject).not.toHaveBeenCalled();
	});

	it("returns 403 for a PENDING track owned by someone else", async () => {
		mockTrack("PENDING");
		mockGetSession.mockResolvedValue({ user: { id: OTHER_USER_ID } });

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(403);
		expect(body.error).toBe("Forbidden");
		expect(mockDownloadObject).not.toHaveBeenCalled();
	});

	it("returns a PENDING track to its owner, uncached", async () => {
		mockTrack("PENDING");
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.status).toBe("PENDING");
		expect(res.headers.get("Cache-Control")).toBeNull();
	});

	it("returns 401 for a REJECTED track without a session", async () => {
		mockTrack("REJECTED");
		mockGetSession.mockResolvedValue(null);

		const res = await GET(makeRequest(), makeContext());

		expect(res.status).toBe(401);
	});

	// ─── Not found ───────────────────────────────────────

	it("returns 404 when the submission does not exist", async () => {
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(null);

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body.error).toBe("Submission not found");
		expect(mockGetSession).not.toHaveBeenCalled();
	});

	// ─── Stored flight data wins over re-parsing ─────────

	it("prefers the stored flightData over the freshly parsed one", async () => {
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue({
			...baseSubmission,
			flightData: {
				header: { ...parsed.header, pilot: "Stored Pilot" },
				stats: { ...parsed.stats, totalDistanceKm: 99 },
			},
		});
		mockDownloadObject.mockResolvedValue("igc file content");
		mockParseIGC.mockReturnValue(parsed);

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(body.header.pilot).toBe("Stored Pilot");
		expect(body.stats.totalDistanceKm).toBe(99);
		// Fixes always come from the file: they are not stored on the record.
		expect(body.fixes).toHaveLength(1);
	});
});
