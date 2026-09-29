import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({
	// Run the deferred callback inline so the test can observe it.
	after: vi.fn((callback: () => unknown) => callback()),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/telegram", () => ({ announceEvent: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
	prisma: { event: { create: vi.fn(), update: vi.fn() } },
}));

import upsertEvent from "@/actions/upsertEvent";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { announceEvent } from "@/lib/telegram";

const mockGetSessionUser = getSessionUser as unknown as ReturnType<
	typeof vi.fn
>;
const mockAnnounce = announceEvent as unknown as ReturnType<typeof vi.fn>;
const mockPrisma = prisma as unknown as {
	event: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
};

const input = {
	title: "Befana Cup",
	description: "<p>Ciao</p>",
	eventDate: "2026-01-06",
	isMemberOnly: false,
};
const saved = { id: "evt1", ...input, eventDate: new Date("2026-01-06") };

beforeEach(() => {
	vi.clearAllMocks();
	mockGetSessionUser.mockResolvedValue({ id: "admin1", role: "ADMIN" });
	mockPrisma.event.create.mockResolvedValue(saved);
	mockPrisma.event.update.mockResolvedValue(saved);
});

describe("upsertEvent", () => {
	it("announces a new event when asked to", async () => {
		await upsertEvent({ ...input, announceOnTelegram: true });
		expect(mockAnnounce).toHaveBeenCalledWith(saved);
	});

	it("does not announce when the admin opted out", async () => {
		await upsertEvent({ ...input, announceOnTelegram: false });
		expect(mockPrisma.event.create).toHaveBeenCalled();
		expect(mockAnnounce).not.toHaveBeenCalled();
	});

	it("never announces an edit", async () => {
		await upsertEvent({ ...input, id: "evt1", announceOnTelegram: true });
		expect(mockPrisma.event.update).toHaveBeenCalled();
		expect(mockAnnounce).not.toHaveBeenCalled();
	});

	it("does not pass the flag to Prisma", async () => {
		await upsertEvent({ ...input, announceOnTelegram: true });
		expect(mockPrisma.event.create.mock.calls[0][0].data).not.toHaveProperty(
			"announceOnTelegram",
		);
	});

	it("rejects non-admins before saving or announcing", async () => {
		mockGetSessionUser.mockResolvedValue({ id: "u1", role: "USER" });
		await expect(
			upsertEvent({ ...input, announceOnTelegram: true }),
		).rejects.toThrow("Unauthorized");
		expect(mockPrisma.event.create).not.toHaveBeenCalled();
		expect(mockAnnounce).not.toHaveBeenCalled();
	});
});
