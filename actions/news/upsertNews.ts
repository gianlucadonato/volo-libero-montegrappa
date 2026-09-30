"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { renderNewsHtml } from "@/lib/news-render";
import type { NewsPartialBlock } from "@/lib/news-schema";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { NewsSchema } from "@/schemas";
import { uniqueNewsSlug } from "@/store/news";

type NewsInput = z.input<typeof NewsSchema>;

export default async function upsertNews(input: NewsInput & { id?: string }) {
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

	revalidatePath("/news");
	revalidatePath(`/news/${news.slug}`);
	revalidatePath("/");
	return { id: news.id, slug: news.slug };
}
