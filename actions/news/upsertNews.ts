"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import type { z } from "zod";
import { renderNewsHtml } from "@/lib/news-render";
import type { NewsPartialBlock } from "@/lib/news-schema";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { type AnnounceableNews, announceNews } from "@/lib/telegram";
import { NewsSchema } from "@/schemas";
import { uniqueNewsSlug } from "@/store/news";

type NewsInput = z.input<typeof NewsSchema>;

export default async function upsertNews({
	announceOnTelegram = false,
	...input
}: NewsInput & { id?: string; announceOnTelegram?: boolean }) {
	const user = await getSessionUser();
	if (!user || user.role !== "ADMIN") {
		throw new Error("Unauthorized");
	}

	const data = NewsSchema.parse(input);
	const content = data.content as NewsPartialBlock[];
	const fields = {
		title: data.title,
		excerpt: data.excerpt || null,
		// Prisma skips undefined fields on update, so a removed cover must be an
		// explicit null to clear the column.
		coverUrl: data.coverUrl || null,
		content: data.content as object[],
		contentHtml: await renderNewsHtml(content),
		// A date-only value is midnight UTC, the same as event dates.
		publishedAt: new Date(data.publishedAt),
		draft: data.draft,
	};

	// The slug is fixed at creation: editing a title must not break links that
	// have already been shared.
	const news = input.id
		? await prisma.news.update({ where: { id: input.id }, data: fields })
		: await prisma.news.create({
				data: {
					...fields,
					slug: await uniqueNewsSlug(slugify(data.title) || "news"),
					createdBy: user.id,
				},
			});

	// Posted once, on the first save that makes the news public. A future date
	// is skipped rather than scheduled: the admin can post it on a later save.
	if (
		announceOnTelegram &&
		!news.draft &&
		!news.announcedAt &&
		news.publishedAt <= new Date()
	) {
		after(() => announceOnce(news));
	}

	revalidatePath("/news");
	revalidatePath(`/news/${news.slug}`);
	revalidatePath("/");
	return { id: news.id, slug: news.slug };
}

/**
 * Claims the news before posting, so two saves in quick succession can't both
 * post it, and releases the claim if the post fails so a later save can retry.
 */
async function announceOnce(news: AnnounceableNews) {
	const { count } = await prisma.news.updateMany({
		where: { id: news.id, announcedAt: null },
		data: { announcedAt: new Date() },
	});
	if (count === 0) return;

	if (!(await announceNews(news))) {
		await prisma.news.update({
			where: { id: news.id },
			data: { announcedAt: null },
		});
	}
}
