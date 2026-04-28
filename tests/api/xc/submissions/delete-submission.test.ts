import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/xc/submissions/[id]/route";

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
	deleteObject: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Import mocked modules to set up return values
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/r2";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
	typeof vi.fn
>;
const mockDeleteObject = deleteObject as unknown as ReturnType<typeof vi.fn>;
const mockPrisma = prisma as unknown as {
	xcTrackSubmission: {
		findUnique: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
		aggregate: ReturnType<typeof vi.fn>;
		findMany: ReturnType<typeof vi.fn>;
	};
	xcProgress: {
		findUnique: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	xcEdition: {
		findUniqueOrThrow: ReturnType<typeof vi.fn>;
	};
};

// ── Helpers ──────────────────────────────────────────────

function makeRequest() {
	return new Request("http://localhost/api/xc/submissions/sub-1", {
		method: "DELETE",
	});
}

function makeContext(id = "sub-1") {
	return { params: Promise.resolve({ id }) };
}

const USER_ID = "user-1";
const OTHER_USER_ID = "user-other";
const EDITION_ID = 2026;

const baseTask = {
	id: "task-1",
	slug: "task-slug",
	name: "Test Task",
	points: 100,
	category: "BASIC" as const,
	distanceKm: 10,
};

const baseSubmission = {
	id: "sub-1",
	userId: USER_ID,
	editionId: EDITION_ID,
	taskId: "task-1",
	status: "APPROVED" as const,
	fileName: "uploads/2026/user-1/task-1/track.igc",
	checksum: "abc",
	notes: null,
	pointsAwarded: 100,
	validationResult: null,
	flightData: {
		header: { date: "2026-04-01", pilot: "Test Pilot" },
		stats: {
			totalDistanceKm: 12.5,
			durationSeconds: 3600,
			maxAltitude: 1500,
		},
	},
	reviewedAt: null,
	reviewedBy: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	task: baseTask,
};

const baseProgress = {
	id: "prog-1",
	userId: USER_ID,
	editionId: EDITION_ID,
	category: "BASIC" as const,
	points: 200,
	minPoints: 700,
	totalDistanceKm: 25,
	flightTimeHrs: 2,
	maxAltM: 1500,
	completedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const baseEdition = {
	id: EDITION_ID,
	title: "XC 2026",
	minPoints: 700,
	maxPoints: 1000,
};

// ── Tests ────────────────────────────────────────────────

beforeEach(() => {
	vi.resetAllMocks();
});

describe("DELETE /xc/submissions/[id]", () => {
	// ─── Auth ────────────────────────────────────────────

	it("returns 401 when not authenticated", async () => {
		mockGetSession.mockResolvedValue(null);

		const res = await DELETE(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(401);
		expect(body.error).toBe("Unauthorized");
	});

	// ─── Not found ───────────────────────────────────────

	it("returns 404 when submission does not exist", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(null);

		const res = await DELETE(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body.error).toBe("Submission not found");
	});

	// ─── Forbidden ───────────────────────────────────────

	it("returns 403 when submission belongs to another user", async () => {
		mockGetSession.mockResolvedValue({ user: { id: OTHER_USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(baseSubmission);

		const res = await DELETE(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(403);
		expect(body.error).toBe("Forbidden");
	});

	// ─── Successful delete (no progress exists) ──────────

	it("deletes R2 file and submission even when no progress exists", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(baseSubmission);
		mockPrisma.xcTrackSubmission.delete.mockResolvedValue(baseSubmission);
		mockPrisma.xcProgress.findUnique.mockResolvedValue(null);

		const res = await DELETE(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(mockDeleteObject).toHaveBeenCalledWith(baseSubmission.fileName);
		expect(mockPrisma.xcTrackSubmission.delete).toHaveBeenCalledWith({
			where: { id: "sub-1" },
		});
		expect(mockPrisma.xcProgress.update).not.toHaveBeenCalled();
		expect(mockPrisma.xcProgress.delete).not.toHaveBeenCalled();
	});

	// ─── Delete last approved submission → delete progress ─

	it("deletes progress when no approved submissions remain", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(baseSubmission);
		mockPrisma.xcTrackSubmission.delete.mockResolvedValue(baseSubmission);
		mockPrisma.xcProgress.findUnique.mockResolvedValue(baseProgress);
		mockPrisma.xcTrackSubmission.aggregate.mockResolvedValue({
			_sum: { pointsAwarded: 0 },
			_count: 0,
		});
		mockPrisma.xcProgress.delete.mockResolvedValue(baseProgress);

		const res = await DELETE(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(mockPrisma.xcProgress.delete).toHaveBeenCalledWith({
			where: { id: baseProgress.id },
		});
		expect(mockPrisma.xcProgress.update).not.toHaveBeenCalled();
	});

	// ─── Delete with remaining approved submissions ──────

	it("recalculates progress points and flight stats from remaining submissions", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(baseSubmission);
		mockPrisma.xcTrackSubmission.delete.mockResolvedValue(baseSubmission);
		mockPrisma.xcProgress.findUnique.mockResolvedValue(baseProgress);
		mockPrisma.xcTrackSubmission.aggregate.mockResolvedValue({
			_sum: { pointsAwarded: 150 },
			_count: 2,
		});
		mockPrisma.xcEdition.findUniqueOrThrow.mockResolvedValue(baseEdition);
		mockPrisma.xcTrackSubmission.findMany.mockResolvedValue([
			{
				flightData: {
					stats: {
						totalDistanceKm: 10,
						durationSeconds: 1800,
						maxAltitude: 1200,
					},
				},
			},
			{
				flightData: {
					stats: {
						totalDistanceKm: 8,
						durationSeconds: 2400,
						maxAltitude: 1400,
					},
				},
			},
		]);
		mockPrisma.xcProgress.update.mockResolvedValue({});

		const res = await DELETE(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(mockPrisma.xcProgress.update).toHaveBeenCalledWith({
			where: {
				userId_editionId_category: {
					userId: USER_ID,
					editionId: EDITION_ID,
					category: "BASIC",
				},
			},
			data: {
				points: 150,
				totalDistanceKm: 18,
				flightTimeHrs: expect.closeTo(1.1667, 3),
				maxAltM: 1400,
				completedAt: null, // 150 < 700 minPoints
			},
		});
	});

	// ─── Preserves completedAt when still above minPoints ─

	it("preserves completedAt when total points still meet minPoints", async () => {
		const completedDate = new Date("2026-03-15");
		const completedProgress = {
			...baseProgress,
			points: 800,
			completedAt: completedDate,
		};

		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(baseSubmission);
		mockPrisma.xcTrackSubmission.delete.mockResolvedValue(baseSubmission);
		mockPrisma.xcProgress.findUnique.mockResolvedValue(completedProgress);
		mockPrisma.xcTrackSubmission.aggregate.mockResolvedValue({
			_sum: { pointsAwarded: 750 },
			_count: 5,
		});
		mockPrisma.xcEdition.findUniqueOrThrow.mockResolvedValue(baseEdition);
		mockPrisma.xcTrackSubmission.findMany.mockResolvedValue([
			{
				flightData: {
					stats: { totalDistanceKm: 5, durationSeconds: 900, maxAltitude: 800 },
				},
			},
		]);
		mockPrisma.xcProgress.update.mockResolvedValue({});

		await DELETE(makeRequest(), makeContext());

		expect(mockPrisma.xcProgress.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					points: 750,
					completedAt: completedDate, // preserved
				}),
			}),
		);
	});

	// ─── Clears completedAt when below minPoints ─────────

	it("clears completedAt when total points drop below minPoints", async () => {
		const completedProgress = {
			...baseProgress,
			points: 800,
			completedAt: new Date("2026-03-15"),
		};

		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(baseSubmission);
		mockPrisma.xcTrackSubmission.delete.mockResolvedValue(baseSubmission);
		mockPrisma.xcProgress.findUnique.mockResolvedValue(completedProgress);
		mockPrisma.xcTrackSubmission.aggregate.mockResolvedValue({
			_sum: { pointsAwarded: 600 },
			_count: 3,
		});
		mockPrisma.xcEdition.findUniqueOrThrow.mockResolvedValue(baseEdition);
		mockPrisma.xcTrackSubmission.findMany.mockResolvedValue([
			{
				flightData: {
					stats: { totalDistanceKm: 5, durationSeconds: 900, maxAltitude: 800 },
				},
			},
		]);
		mockPrisma.xcProgress.update.mockResolvedValue({});

		await DELETE(makeRequest(), makeContext());

		expect(mockPrisma.xcProgress.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					completedAt: null, // cleared
				}),
			}),
		);
	});

	// ─── R2 delete failure does not block the operation ──

	it("succeeds even when R2 deleteObject fails", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(baseSubmission);
		mockPrisma.xcTrackSubmission.delete.mockResolvedValue(baseSubmission);
		mockPrisma.xcProgress.findUnique.mockResolvedValue(null);
		mockDeleteObject.mockRejectedValue(new Error("R2 network error"));

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await DELETE(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(mockPrisma.xcTrackSubmission.delete).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	// ─── Handles submissions with null/missing flightData ─

	it("handles remaining submissions with null flightData gracefully", async () => {
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(baseSubmission);
		mockPrisma.xcTrackSubmission.delete.mockResolvedValue(baseSubmission);
		mockPrisma.xcProgress.findUnique.mockResolvedValue(baseProgress);
		mockPrisma.xcTrackSubmission.aggregate.mockResolvedValue({
			_sum: { pointsAwarded: 100 },
			_count: 2,
		});
		mockPrisma.xcEdition.findUniqueOrThrow.mockResolvedValue(baseEdition);
		mockPrisma.xcTrackSubmission.findMany.mockResolvedValue([
			{ flightData: null },
			{
				flightData: {
					stats: {
						totalDistanceKm: 10,
						durationSeconds: 3600,
						maxAltitude: 1000,
					},
				},
			},
		]);
		mockPrisma.xcProgress.update.mockResolvedValue({});

		const res = await DELETE(makeRequest(), makeContext());

		expect(res.status).toBe(200);
		expect(mockPrisma.xcProgress.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					totalDistanceKm: 10,
					flightTimeHrs: 1,
					maxAltM: 1000,
				}),
			}),
		);
	});

	// ─── Deletes a PENDING submission (no progress update) ─

	it("deletes a PENDING submission without updating progress", async () => {
		const pendingSubmission = {
			...baseSubmission,
			status: "PENDING" as const,
			pointsAwarded: 0,
		};

		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
		mockPrisma.xcTrackSubmission.findUnique.mockResolvedValue(
			pendingSubmission,
		);
		mockPrisma.xcTrackSubmission.delete.mockResolvedValue(pendingSubmission);
		mockPrisma.xcProgress.findUnique.mockResolvedValue(null);

		const res = await DELETE(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(mockDeleteObject).toHaveBeenCalledWith(pendingSubmission.fileName);
		expect(mockPrisma.xcProgress.update).not.toHaveBeenCalled();
	});
});
