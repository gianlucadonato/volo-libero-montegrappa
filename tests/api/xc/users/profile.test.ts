import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/xc/users/[id]/route";

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
		user: { findFirst: vi.fn() },
		xcEdition: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
		xcProgress: { findMany: vi.fn(), aggregate: vi.fn(), count: vi.fn() },
		xcEditionTasks: { findMany: vi.fn() },
		xcTrackSubmission: { findMany: vi.fn(), count: vi.fn() },
	},
}));

vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// Import mocked modules to set up return values
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
	typeof vi.fn
>;
const mockPrisma = prisma as unknown as {
	user: { findFirst: ReturnType<typeof vi.fn> };
	xcEdition: {
		findMany: ReturnType<typeof vi.fn>;
		findFirst: ReturnType<typeof vi.fn>;
		findUnique: ReturnType<typeof vi.fn>;
	};
	xcProgress: {
		findMany: ReturnType<typeof vi.fn>;
		aggregate: ReturnType<typeof vi.fn>;
		count: ReturnType<typeof vi.fn>;
	};
	xcEditionTasks: { findMany: ReturnType<typeof vi.fn> };
	xcTrackSubmission: {
		findMany: ReturnType<typeof vi.fn>;
		count: ReturnType<typeof vi.fn>;
	};
};

// ── Helpers ──────────────────────────────────────────────

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const EDITION_ID = 2026;
const PREVIOUS_EDITION_ID = 2025;

function makeRequest(query = "") {
	return new Request(`http://localhost/api/xc/users/${USER_ID}${query}`);
}

function makeContext(id = USER_ID) {
	return { params: Promise.resolve({ id }) };
}

const pilot = {
	id: USER_ID,
	firstName: "Mario",
	lastName: "Rossi",
	image: null,
};

const editions = [
	{ id: EDITION_ID, title: "XC 2026", isActive: true },
	{ id: PREVIOUS_EDITION_ID, title: "XC 2025", isActive: false },
];

const basicProgress = {
	id: "prog-1",
	userId: USER_ID,
	editionId: EDITION_ID,
	category: "BASIC" as const,
	points: 300,
	minPoints: 700,
	totalDistanceKm: 42,
	flightTimeHrs: 3,
	maxAltM: 1800,
	completedAt: null,
	createdAt: new Date("2026-04-01"),
	updatedAt: new Date("2026-04-01"),
};

const approvedFlight = {
	id: "sub-1",
	userId: USER_ID,
	editionId: EDITION_ID,
	taskId: "task-1",
	pointsAwarded: 100,
	createdAt: new Date("2026-04-01"),
	flightData: {
		header: { pilot: "Mario Rossi" },
		stats: {
			duration: "01:30:00",
			durationSeconds: 5400,
			totalDistanceKm: 42.3,
			maxAltitude: 1800,
			minAltitude: 400,
			startTime: "2026-04-01T10:00:00.000Z",
			endTime: "2026-04-01T11:30:00.000Z",
		},
	},
	task: {
		id: "task-1",
		slug: "bassano-borso",
		name: "Bassano - Borso",
		category: "BASIC" as const,
		points: 100,
		distanceKm: 15,
		taskFileUrl: "tasks/bassano-borso.xctsk",
	},
};

/** Wires up a pilot with one approved BASIC flight in the active edition. */
function mockProfileData() {
	mockPrisma.user.findFirst.mockResolvedValue(pilot);
	mockPrisma.xcEdition.findMany.mockResolvedValue(editions);
	// The latest edition the pilot took part in.
	mockPrisma.xcEdition.findFirst.mockResolvedValue({ id: EDITION_ID });
	mockPrisma.xcEdition.findUnique.mockImplementation(
		({ where }: { where: { id: number } }) =>
			Promise.resolve({
				id: where.id,
				title: `XC ${where.id}`,
				minPoints: 700,
				maxPoints: 1000,
				isActive: where.id === EDITION_ID,
			}),
	);
	// The rank lookup selects only userId; the progress lookup selects everything.
	mockPrisma.xcProgress.findMany.mockImplementation(
		(args: { select?: { userId?: boolean } }) =>
			Promise.resolve(
				args?.select?.userId
					? [{ userId: OTHER_USER_ID }, { userId: USER_ID }]
					: [basicProgress],
			),
	);
	mockPrisma.xcEditionTasks.findMany.mockResolvedValue([
		{ task: { category: "BASIC" } },
		{ task: { category: "BASIC" } },
		{ task: { category: "INTERMEDIATE" } },
	]);
	mockPrisma.xcTrackSubmission.findMany.mockResolvedValue([approvedFlight]);
	mockPrisma.xcProgress.aggregate.mockResolvedValue({
		_sum: { points: 300, totalDistanceKm: 42, flightTimeHrs: 3 },
		_max: { maxAltM: 1800 },
	});
	mockPrisma.xcTrackSubmission.count.mockResolvedValue(1);
	mockPrisma.xcProgress.count.mockResolvedValue(0);
}

// ── Tests ────────────────────────────────────────────────

beforeEach(() => {
	vi.resetAllMocks();
});

describe("GET /xc/users/[id]", () => {
	// ─── Public access ───────────────────────────────────

	it("returns the profile without a session", async () => {
		mockProfileData();

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(mockGetSession).not.toHaveBeenCalled();
		expect(body.user).toEqual({
			id: USER_ID,
			firstName: "Mario",
			lastName: "Rossi",
			image: null,
		});
		expect(body.editions).toHaveLength(2);
	});

	it("never exposes personal data beyond name and avatar", async () => {
		mockProfileData();

		await GET(makeRequest(), makeContext());

		expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
			where: { id: USER_ID, deletedAt: null },
			select: { id: true, firstName: true, lastName: true, image: true },
		});
	});

	// ─── Not found ───────────────────────────────────────

	it("returns 404 for an unknown pilot", async () => {
		mockPrisma.user.findFirst.mockResolvedValue(null);

		const res = await GET(makeRequest(), makeContext("nope"));
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body.error).toBe("Pilot not found");
	});

	it("returns 404 for a soft-deleted pilot", async () => {
		// A soft-deleted user is filtered out by `deletedAt: null`, so the
		// lookup resolves to null exactly like a missing one.
		mockPrisma.user.findFirst.mockResolvedValue(null);

		const res = await GET(makeRequest(), makeContext());

		expect(res.status).toBe(404);
		expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ deletedAt: null }),
			}),
		);
	});

	// ─── Flights ─────────────────────────────────────────

	it("only queries APPROVED submissions", async () => {
		mockProfileData();

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(mockPrisma.xcTrackSubmission.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					userId: USER_ID,
					editionId: EDITION_ID,
					status: "APPROVED",
				}),
			}),
		);
		expect(body.flights).toHaveLength(1);
		expect(body.flights[0]).toMatchObject({
			id: "sub-1",
			pointsAwarded: 100,
			task: { slug: "bassano-borso", category: "BASIC" },
			stats: { totalDistanceKm: 42.3, maxAltitude: 1800 },
		});
	});

	// ─── Categories ──────────────────────────────────────

	it("returns all three categories with rank and task counters", async () => {
		mockProfileData();

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(
			body.categories.map((c: { category: string }) => c.category),
		).toEqual(["BASIC", "INTERMEDIATE", "ADVANCED"]);

		const basic = body.categories[0];
		expect(basic).toMatchObject({
			points: 300,
			rank: 2,
			totalPilots: 2,
			tasksCompleted: 1,
			tasksTotal: 2,
			minPoints: 700,
			maxPoints: 1000,
		});

		// No progress in these categories → no rank, no leaderboard lookup.
		expect(body.categories[1].rank).toBeNull();
		expect(body.categories[2].rank).toBeNull();
	});

	// ─── Edition selection ───────────────────────────────

	it("defaults to the most recent edition the pilot took part in", async () => {
		mockProfileData();

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(body.edition.id).toBe(EDITION_ID);
	});

	it("lists every edition, not only the ones the pilot joined", async () => {
		mockProfileData();
		const newer = { id: EDITION_ID + 1, title: "XC next", isActive: false };
		mockPrisma.xcEdition.findMany.mockResolvedValue([newer, ...editions]);

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(mockPrisma.xcEdition.findMany).toHaveBeenCalledWith(
			expect.not.objectContaining({ where: expect.anything() }),
		);
		expect(body.editions.map((e: { id: number }) => e.id)).toEqual([
			EDITION_ID + 1,
			EDITION_ID,
			PREVIOUS_EDITION_ID,
		]);
		// A newer edition the pilot has not joined is listed, not shown.
		expect(body.edition.id).toBe(EDITION_ID);
		expect(body.hasJoined).toBe(true);
	});

	it("counts enrolling as taking part, for a pilot without flights", async () => {
		mockProfileData();

		await GET(makeRequest(), makeContext());

		expect(mockPrisma.xcEdition.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					OR: expect.arrayContaining([
						{ enrollments: { some: { userId: USER_ID } } },
					]),
				},
			}),
		);
	});

	it("shows the newest edition to a pilot who never took part", async () => {
		mockProfileData();
		mockPrisma.xcEdition.findFirst.mockResolvedValue(null);

		const res = await GET(makeRequest(), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.hasJoined).toBe(false);
		expect(body.edition.id).toBe(EDITION_ID);
	});

	it("scopes the header stats to the selected edition", async () => {
		mockProfileData();

		const res = await GET(
			makeRequest(`?edition=${PREVIOUS_EDITION_ID}`),
			makeContext(),
		);
		const body = await res.json();

		for (const query of [
			mockPrisma.xcProgress.aggregate,
			mockPrisma.xcProgress.count,
		]) {
			expect(query).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({ editionId: PREVIOUS_EDITION_ID }),
				}),
			);
		}
		// One approved flight in the mocked edition.
		expect(body.totals.flights).toBe(1);
	});

	it("honours the ?edition= filter", async () => {
		mockProfileData();

		const res = await GET(
			makeRequest(`?edition=${PREVIOUS_EDITION_ID}`),
			makeContext(),
		);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.edition.id).toBe(PREVIOUS_EDITION_ID);
		expect(mockPrisma.xcTrackSubmission.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ editionId: PREVIOUS_EDITION_ID }),
			}),
		);
	});

	it("falls back to the default edition when ?edition= does not exist", async () => {
		mockProfileData();

		const res = await GET(makeRequest("?edition=1999"), makeContext());
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.edition.id).toBe(EDITION_ID);
	});

	it("returns 400 for a non-numeric ?edition=", async () => {
		const res = await GET(makeRequest("?edition=abc"), makeContext());
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toBe("Edition not valid");
		expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
	});
});
