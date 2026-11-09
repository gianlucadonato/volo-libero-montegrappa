import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/xc/enroll/route";

vi.mock("server-only", () => ({}));

vi.mock("@/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("next/headers", () => ({
	headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/prisma", () => ({
	prisma: { user: { findUnique: vi.fn() } },
}));

vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/actions/xc/createXcEnrollment", () => ({
	default: vi.fn(),
}));

import createXcEnrollment from "@/actions/xc/createXcEnrollment";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
	typeof vi.fn
>;
const mockFindUser = prisma.user.findUnique as unknown as ReturnType<
	typeof vi.fn
>;
const mockCreate = createXcEnrollment as unknown as ReturnType<typeof vi.fn>;

const USER_ID = "user-1";

const completeUser = {
	emailVerified: true,
	firstName: "Anna",
	lastName: "Rossi",
	dateOfBirth: "01/02/1990",
	placeOfBirth: "Bassano del Grappa",
	streetAddress: "Via Roma 1",
	city: "Bassano del Grappa",
	zipCode: "36061",
	province: "VI",
	state: "ITA",
	phone: "3330000000",
	fiscalCode: "RSSNNA90B41A703X",
	gender: "F",
};

describe("POST /api/xc/enroll", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetSession.mockResolvedValue({ user: { id: USER_ID } });
	});

	it("returns 401 without a session", async () => {
		mockGetSession.mockResolvedValue(null);
		const res = await POST();
		expect(res.status).toBe(401);
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it("refuses a user who has not verified the email", async () => {
		// A session opened before verification became mandatory.
		mockFindUser.mockResolvedValue({ ...completeUser, emailVerified: false });
		const res = await POST();
		expect(res.status).toBe(403);
		expect(await res.json()).toEqual({ error: "EMAIL_NOT_VERIFIED" });
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it("refuses a user whose profile is incomplete", async () => {
		mockFindUser.mockResolvedValue({ ...completeUser, fiscalCode: null });
		const res = await POST();
		expect(res.status).toBe(403);
		expect(await res.json()).toEqual({ error: "PROFILE_INCOMPLETE" });
		expect(mockCreate).not.toHaveBeenCalled();
	});

	it("enrolls a verified user with a complete profile", async () => {
		mockFindUser.mockResolvedValue(completeUser);
		mockCreate.mockResolvedValue({ id: "enrollment-1" });
		const res = await POST();
		expect(res.status).toBe(201);
		expect(mockCreate).toHaveBeenCalledWith({ userId: USER_ID });
	});
});
