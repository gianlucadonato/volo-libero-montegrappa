import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
	prisma: { news: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { uniqueNewsSlug } from "@/store/news";

const mockFindMany = prisma.news.findMany as unknown as ReturnType<
	typeof vi.fn
>;
const taken = (...slugs: string[]) =>
	mockFindMany.mockResolvedValue(slugs.map((slug) => ({ slug })));

beforeEach(() => vi.clearAllMocks());

describe("uniqueNewsSlug", () => {
	it("uses the base when it is free", async () => {
		taken("gara-2025");
		expect(await uniqueNewsSlug("gara")).toBe("gara");
	});

	it("appends the first free suffix", async () => {
		taken("gara", "gara-2", "gara-4");
		expect(await uniqueNewsSlug("gara")).toBe("gara-3");
	});

	it("never hands out a reserved route segment", async () => {
		taken();
		expect(await uniqueNewsSlug("new")).toBe("new-2");
	});

	it("counts deleted news as taken", async () => {
		taken();
		await uniqueNewsSlug("gara");
		expect(mockFindMany.mock.calls[0][0].where).not.toHaveProperty("deletedAt");
	});
});
