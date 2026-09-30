import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const deferred = vi.hoisted(() => [] as Promise<unknown>[]);
vi.mock("next/server", () => ({
	// Run the deferred callback inline, keeping its promise to await.
	after: vi.fn((callback: () => unknown) => {
		deferred.push(Promise.resolve(callback()));
	}),
}));
vi.mock("@/lib/telegram", () => ({ announceNews: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/news-render", () => ({
	renderNewsHtml: vi.fn().mockResolvedValue("<p>Ciao</p>"),
}));
vi.mock("@/store/news", () => ({
	uniqueNewsSlug: vi.fn(async (base: string) => base),
}));
vi.mock("@/lib/prisma", () => ({
	prisma: {
		news: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
	},
}));

import upsertNews from "@/actions/news/upsertNews";
import { NEWS_IMAGES_BASE_URL } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { announceNews } from "@/lib/telegram";

const mockGetSessionUser = getSessionUser as unknown as ReturnType<
	typeof vi.fn
>;
const mockAnnounce = announceNews as unknown as ReturnType<typeof vi.fn>;
const mockPrisma = prisma as unknown as {
	news: {
		create: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		updateMany: ReturnType<typeof vi.fn>;
	};
};

const input = {
	title: "Sarà una bella stagione",
	excerpt: "",
	content: [{ type: "paragraph" }],
	publishedAt: "2026-09-01",
	draft: false,
};

/** Calls upsertNews, then waits for the work it deferred with after(). */
async function save(...args: Parameters<typeof upsertNews>) {
	const result = await upsertNews(...args);
	await Promise.all(deferred.splice(0));
	return result;
}

beforeEach(() => {
	vi.clearAllMocks();
	deferred.length = 0;
	mockGetSessionUser.mockResolvedValue({ id: "admin1", role: "ADMIN" });
	mockPrisma.news.create.mockImplementation(async ({ data }) => ({
		id: "n1",
		...data,
	}));
	mockPrisma.news.update.mockResolvedValue({ id: "n1", slug: "old-slug" });
	mockPrisma.news.updateMany.mockResolvedValue({ count: 1 });
	mockAnnounce.mockResolvedValue(true);
});

describe("upsertNews", () => {
	it("creates a news with a slug from the title and rendered HTML", async () => {
		expect(await upsertNews(input)).toEqual({
			id: "n1",
			slug: "sara-una-bella-stagione",
		});
		const { data } = mockPrisma.news.create.mock.calls[0][0];
		expect(data).toMatchObject({
			contentHtml: "<p>Ciao</p>",
			excerpt: null,
			coverUrl: null,
			createdBy: "admin1",
			publishedAt: new Date("2026-09-01T00:00:00Z"),
		});
	});

	it("keeps the slug when editing", async () => {
		expect(
			await upsertNews({ ...input, id: "n1", title: "Nuovo titolo" }),
		).toEqual({
			id: "n1",
			slug: "old-slug",
		});
		const { data } = mockPrisma.news.update.mock.calls[0][0];
		expect(data).not.toHaveProperty("slug");
		expect(data.coverUrl).toBeNull();
	});

	it("rejects covers from outside the news bucket", async () => {
		await expect(
			upsertNews({ ...input, coverUrl: "https://evil.example/x.jpg" }),
		).rejects.toThrow();
		await expect(
			upsertNews({ ...input, coverUrl: `${NEWS_IMAGES_BASE_URL}a.jpg` }),
		).resolves.toBeDefined();
	});

	it("rejects non-admins before saving", async () => {
		mockGetSessionUser.mockResolvedValue({ id: "u1", role: "MEMBER" });
		await expect(upsertNews(input)).rejects.toThrow("Unauthorized");
		expect(mockPrisma.news.create).not.toHaveBeenCalled();
	});

	describe("Telegram announcement", () => {
		const published = {
			id: "n1",
			slug: "old-slug",
			draft: false,
			announcedAt: null,
			publishedAt: new Date("2026-09-01T00:00:00Z"),
		};

		it("announces a new published news when asked to", async () => {
			await save({ ...input, announceOnTelegram: true });
			expect(mockPrisma.news.updateMany).toHaveBeenCalledWith({
				where: { id: "n1", announcedAt: null },
				data: { announcedAt: expect.any(Date) },
			});
			expect(mockAnnounce).toHaveBeenCalledWith(
				expect.objectContaining({ id: "n1", slug: "sara-una-bella-stagione" }),
			);
		});

		it("does not announce when the admin opted out", async () => {
			await save({ ...input, announceOnTelegram: false });
			expect(mockAnnounce).not.toHaveBeenCalled();
		});

		it("does not announce drafts", async () => {
			await save({ ...input, draft: true, announceOnTelegram: true });
			expect(mockAnnounce).not.toHaveBeenCalled();
		});

		it("does not announce future-dated news", async () => {
			await save({
				...input,
				publishedAt: "2099-01-01",
				announceOnTelegram: true,
			});
			expect(mockAnnounce).not.toHaveBeenCalled();
		});

		it("announces a draft when an edit publishes it", async () => {
			mockPrisma.news.update.mockResolvedValue(published);
			await save({ ...input, id: "n1", announceOnTelegram: true });
			expect(mockAnnounce).toHaveBeenCalledWith(published);
		});

		it("never announces a news twice", async () => {
			mockPrisma.news.update.mockResolvedValue({
				...published,
				announcedAt: new Date(),
			});
			await save({ ...input, id: "n1", announceOnTelegram: true });
			expect(mockAnnounce).not.toHaveBeenCalled();
		});

		it("skips the post when a concurrent save already claimed it", async () => {
			mockPrisma.news.updateMany.mockResolvedValue({ count: 0 });
			await save({ ...input, announceOnTelegram: true });
			expect(mockAnnounce).not.toHaveBeenCalled();
		});

		it("releases the claim when the post fails, so a later save can retry", async () => {
			mockAnnounce.mockResolvedValue(false);
			await save({ ...input, announceOnTelegram: true });
			expect(mockPrisma.news.update).toHaveBeenCalledWith({
				where: { id: "n1" },
				data: { announcedAt: null },
			});
		});

		it("does not pass the flag to Prisma", async () => {
			await save({ ...input, announceOnTelegram: true });
			expect(mockPrisma.news.create.mock.calls[0][0].data).not.toHaveProperty(
				"announceOnTelegram",
			);
		});
	});
});
