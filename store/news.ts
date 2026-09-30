import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/prisma/generated/client";

/**
 * A news is public when it isn't a draft, isn't deleted, and its publish date
 * has come. Future-dated news stays hidden until that day.
 */
export const publishedNewsWhere = (): Prisma.NewsWhereInput => ({
	draft: false,
	deletedAt: null,
	publishedAt: { lte: new Date() },
});

const listSelect = {
	id: true,
	slug: true,
	title: true,
	excerpt: true,
	coverUrl: true,
	publishedAt: true,
	draft: true,
} satisfies Prisma.NewsSelect;

export type NewsListItem = Prisma.NewsGetPayload<{
	select: typeof listSelect;
}>;

/**
 * Newest first, with the id as a tiebreaker so news sharing a publish date
 * always come out in the same order.
 */
const newestFirst = [
	{ publishedAt: "desc" },
	{ createdAt: "desc" },
	{ id: "desc" },
] satisfies Prisma.NewsOrderByWithRelationInput[];

export function listPublishedNews(take?: number): Promise<NewsListItem[]> {
	return prisma.news.findMany({
		where: publishedNewsWhere(),
		select: listSelect,
		orderBy: newestFirst,
		take,
	});
}

/** Every non-deleted news, drafts and scheduled ones included, for admins. */
export function listAllNews(): Promise<NewsListItem[]> {
	return prisma.news.findMany({
		where: { deletedAt: null },
		select: listSelect,
		orderBy: newestFirst,
	});
}

export function getPublishedNewsBySlug(slug: string) {
	return prisma.news.findFirst({
		where: { ...publishedNewsWhere(), slug },
	});
}

/** A non-deleted news by slug, drafts included: admins preview them. */
export function getNewsBySlug(slug: string) {
	return prisma.news.findFirst({ where: { slug, deletedAt: null } });
}

export function getNewsById(id: string) {
	return prisma.news.findFirst({ where: { id, deletedAt: null } });
}

/** Slugs that would collide with the admin routes under /news. */
const RESERVED_SLUGS = new Set(["new"]);

/**
 * The first free slug for `base`: the base itself, then base-2, base-3, ….
 * Deleted news keep their slug, so an old link never starts pointing at a
 * different post.
 */
export async function uniqueNewsSlug(
	base: string,
	excludeId?: string,
): Promise<string> {
	const taken = await prisma.news.findMany({
		where: {
			slug: { startsWith: base },
			...(excludeId ? { id: { not: excludeId } } : {}),
		},
		select: { slug: true },
	});
	const slugs = new Set(taken.map((news) => news.slug));
	for (const reserved of RESERVED_SLUGS) slugs.add(reserved);
	if (!slugs.has(base)) return base;
	let suffix = 2;
	while (slugs.has(`${base}-${suffix}`)) suffix += 1;
	return `${base}-${suffix}`;
}
