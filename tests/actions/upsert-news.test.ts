import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/news-render", () => ({
	renderNewsHtml: vi.fn().mockResolvedValue("<p>Ciao</p>"),
}));
vi.mock("@/store/news", () => ({
	uniqueNewsSlug: vi.fn(async (base: string) => base),
}));
vi.mock("@/lib/prisma", () => ({
	prisma: { news: { create: vi.fn(), update: vi.fn() } },
}));

import upsertNews from "@/actions/news/upsertNews";
import { NEWS_IMAGES_BASE_URL } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const mockGetSessionUser = getSessionUser as unknown as ReturnType<
	typeof vi.fn
>;
const mockPrisma = prisma as unknown as {
	news: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
};

const input = {
	title: "Sarà una bella stagione",
	excerpt: "",
	content: [{ type: "paragraph" }],
	publishedAt: "2026-10-01",
	draft: false,
};

beforeEach(() => {
	vi.clearAllMocks();
	mockGetSessionUser.mockResolvedValue({ id: "admin1", role: "ADMIN" });
	mockPrisma.news.create.mockImplementation(async ({ data }) => ({
		id: "n1",
		...data,
	}));
	mockPrisma.news.update.mockResolvedValue({ id: "n1", slug: "old-slug" });
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
			publishedAt: new Date("2026-10-01T00:00:00Z"),
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
});
