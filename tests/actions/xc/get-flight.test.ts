import { beforeEach, describe, expect, it, vi } from "vitest";
import { getXcFlight } from "@/actions/xc/getXcFlight";

// ── Mocks ────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
	prisma: {
		xcTrackSubmission: { findFirst: vi.fn() },
	},
}));

// Import mocked modules to set up return values
import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as unknown as {
	xcTrackSubmission: { findFirst: ReturnType<typeof vi.fn> };
};

// ── Fixtures ─────────────────────────────────────────────

const SUBMISSION_ID = "sub_1";

const task = {
	id: "task_1",
	slug: "B01",
	name: "Panettone - Semonzo",
	category: "BASIC",
	points: 100,
	distanceKm: 42.5,
	taskFileUrl: "https://example.com/b01.tsk",
};

const submission = {
	id: SUBMISSION_ID,
	editionId: 2026,
	pointsAwarded: 100,
	createdAt: new Date("2026-08-19T10:00:00.000Z"),
	flightData: {
		stats: {
			duration: "02:15:00",
			durationSeconds: 8100,
			totalDistanceKm: 51.2,
			maxAltitude: 1695,
			minAltitude: 220,
			startTime: "2026-08-19T08:30:00.000Z",
			endTime: "2026-08-19T10:45:00.000Z",
			fixCount: 4200,
		},
	},
	user: {
		id: "user_1",
		firstName: "Beppino",
		lastName: "Zoccarato",
		image: null,
	},
	edition: { id: 2026, title: "XC Montegrappa 2026" },
	task,
};

describe("getXcFlight", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("only looks up approved flights of non-deleted pilots", async () => {
		mockPrisma.xcTrackSubmission.findFirst.mockResolvedValue(submission);

		await getXcFlight(SUBMISSION_ID);

		const args = mockPrisma.xcTrackSubmission.findFirst.mock.calls[0][0];
		expect(args.where).toEqual({
			id: SUBMISSION_ID,
			status: "APPROVED",
			user: { deletedAt: null },
		});
	});

	it("returns null when no approved flight matches", async () => {
		mockPrisma.xcTrackSubmission.findFirst.mockResolvedValue(null);

		await expect(getXcFlight("pending_or_missing")).resolves.toBeNull();
	});

	it("returns the pilot, the edition and the public flight projection", async () => {
		mockPrisma.xcTrackSubmission.findFirst.mockResolvedValue(submission);

		const data = await getXcFlight(SUBMISSION_ID);

		expect(data).not.toBeNull();
		expect(data?.pilot).toEqual({
			id: "user_1",
			firstName: "Beppino",
			lastName: "Zoccarato",
			image: null,
		});
		expect(data?.edition).toEqual({ id: 2026, title: "XC Montegrappa 2026" });
		expect(data?.flight).toEqual({
			id: SUBMISSION_ID,
			editionId: 2026,
			pointsAwarded: 100,
			createdAt: "2026-08-19T10:00:00.000Z",
			task,
			stats: {
				duration: "02:15:00",
				durationSeconds: 8100,
				totalDistanceKm: 51.2,
				maxAltitude: 1695,
				minAltitude: 220,
				startTime: "2026-08-19T08:30:00.000Z",
				endTime: "2026-08-19T10:45:00.000Z",
			},
		});
	});

	it("never leaks the stored file name or the validation result", async () => {
		mockPrisma.xcTrackSubmission.findFirst.mockResolvedValue({
			...submission,
			fileName: "xc/2026/user_1/secret.igc",
			validationResult: { ok: true },
			reviewedBy: "admin_1",
		});

		const data = await getXcFlight(SUBMISSION_ID);

		expect(Object.keys(data?.flight ?? {})).toEqual([
			"id",
			"editionId",
			"pointsAwarded",
			"createdAt",
			"task",
			"stats",
		]);
	});

	it("tolerates a submission without parsed flight data", async () => {
		mockPrisma.xcTrackSubmission.findFirst.mockResolvedValue({
			...submission,
			flightData: null,
		});

		const data = await getXcFlight(SUBMISSION_ID);

		expect(data?.flight.stats).toBeNull();
	});
});
