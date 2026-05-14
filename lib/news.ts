import { createReader } from "@keystatic/core/reader";
import type { Locale } from "@/i18n/config";
import keystaticConfig from "@/keystatic.config";

export type NewsLocale = Extract<Locale, "it" | "en">;

const reader = createReader(process.cwd(), keystaticConfig);

const collectionForLocale = (locale: NewsLocale) =>
	locale === "en" ? reader.collections.news_en : reader.collections.news_it;

export type NewsListItem = {
	slug: string;
	title: string;
	publishedAt: string;
	excerpt: string;
	coverImage: string | null;
};

const isPublished = (publishedAt: string, draft: boolean) => {
	if (draft) return false;
	return new Date(publishedAt).getTime() <= Date.now();
};

export async function listNews(locale: NewsLocale): Promise<NewsListItem[]> {
	const collection = collectionForLocale(locale);
	const all = await collection.all();
	return all
		.filter((entry) => isPublished(entry.entry.publishedAt, entry.entry.draft))
		.map((entry) => ({
			slug: entry.slug,
			title: entry.entry.title,
			publishedAt: entry.entry.publishedAt,
			excerpt: entry.entry.excerpt,
			coverImage: entry.entry.coverImage,
		}))
		.sort(
			(a, b) =>
				new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
		);
}

export async function getNewsEntry(locale: NewsLocale, slug: string) {
	const collection = collectionForLocale(locale);
	const entry = await collection.read(slug, { resolveLinkedFiles: true });
	if (!entry) return null;
	if (!isPublished(entry.publishedAt, entry.draft)) return null;
	return entry;
}

export async function listNewsSlugs(locale: NewsLocale): Promise<string[]> {
	const collection = collectionForLocale(locale);
	const all = await collection.all();
	return all
		.filter((entry) => isPublished(entry.entry.publishedAt, entry.entry.draft))
		.map((entry) => entry.slug);
}
