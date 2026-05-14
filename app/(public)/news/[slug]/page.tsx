import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import NewsContent from "@/components/news/NewsContent";
import { constructMetadata, siteConfig } from "@/config/site";
import { getNewsEntry, type NewsLocale } from "@/lib/news";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }) {
	const { slug } = await params;
	const locale = ((await getLocale()) as NewsLocale) ?? "it";
	const entry = await getNewsEntry(locale, slug);
	if (!entry) return constructMetadata({ title: `News - ${siteConfig.name}` });
	return constructMetadata({
		title: `${entry.title} - ${siteConfig.name}`,
		description: entry.excerpt || undefined,
		image: entry.coverImage || undefined,
	});
}

export default async function NewsDetailPage({ params }: { params: Params }) {
	const { slug } = await params;
	const t = await getTranslations("NewsPage");
	const locale = ((await getLocale()) as NewsLocale) ?? "it";
	const dateLocale = locale === "en" ? enUS : itLocale;

	const entry = await getNewsEntry(locale, slug);
	if (!entry) notFound();

	return (
		<article className="container mx-auto max-w-3xl px-4 py-10">
			<Link
				href="/news"
				className="mb-6 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
			>
				<ChevronLeft className="h-4 w-4" />
				{t("back_to_news")}
			</Link>

			<header className="mb-8">
				<time className="text-xs uppercase text-gray-500">
					{format(new Date(entry.publishedAt), "d MMMM yyyy", {
						locale: dateLocale,
					})}
				</time>
				<h1 className="mt-2 font-heading text-3xl leading-tight md:text-4xl">
					{entry.title}
				</h1>
				{entry.excerpt && (
					<p className="mt-3 text-lg text-gray-600">{entry.excerpt}</p>
				)}
			</header>

			{entry.coverImage && (
				<div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
					<Image
						src={entry.coverImage}
						alt={entry.title}
						fill
						sizes="(max-width: 768px) 100vw, 768px"
						className="object-cover"
						priority
					/>
				</div>
			)}

			<div className="prose prose-slate max-w-none prose-img:rounded-lg prose-headings:font-heading">
				<NewsContent node={entry.content.node} />
			</div>
		</article>
	);
}
