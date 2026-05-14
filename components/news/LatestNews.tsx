import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { listNews, type NewsLocale } from "@/lib/news";
import { cn } from "@/lib/utils";

const MAX_ITEMS = 4;
const MOBILE_VISIBLE = 3;

export default async function LatestNews() {
	const t = await getTranslations("Homepage.latest_news");
	const locale = ((await getLocale()) as NewsLocale) ?? "it";
	const dateLocale = locale === "en" ? enUS : itLocale;
	const news = (await listNews(locale))
		.slice()
		.sort((a, b) => {
			const diff =
				new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
			if (diff !== 0) return diff;
			// Stable tiebreaker so the leftmost card is always deterministic
			// when multiple entries share the same publish date.
			return b.slug.localeCompare(a.slug);
		})
		.slice(0, MAX_ITEMS);

	if (news.length === 0) return null;

	return (
		<section className="container mx-auto px-4 py-10 sm:py-16">
			<div className="mb-8 flex items-center justify-between gap-4">
				<h2 className="font-heading text-2xl uppercase md:text-3xl">
					{t("title")}
				</h2>
				<Link
					href="/news"
					className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
				>
					{t("view_all")}
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{news.map((item, index) => (
					<Link
						key={item.slug}
						href={`/news/${item.slug}`}
						className={cn(
							"group flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md",
							// Show first 3 on every screen; reveal items 4 only on lg+.
							index >= MOBILE_VISIBLE && "hidden lg:flex",
						)}
					>
						{item.coverImage ? (
							<div className="relative aspect-video w-full overflow-hidden bg-slate-100">
								<Image
									src={item.coverImage}
									alt={item.title}
									fill
									sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 20vw"
									className="object-cover transition group-hover:scale-105"
								/>
							</div>
						) : (
							<div className="aspect-video w-full bg-linear-to-br from-slate-100 to-slate-200" />
						)}
						<div className="flex flex-1 flex-col gap-2 p-4">
							<time className="text-xs uppercase text-gray-500">
								{format(new Date(item.publishedAt), "d MMMM yyyy", {
									locale: dateLocale,
								})}
							</time>
							<h3 className="font-heading text-base leading-snug line-clamp-2">
								{item.title}
							</h3>
							{item.excerpt && (
								<p className="line-clamp-2 text-sm text-gray-600">
									{item.excerpt}
								</p>
							)}
						</div>
					</Link>
				))}
			</div>
		</section>
	);
}
