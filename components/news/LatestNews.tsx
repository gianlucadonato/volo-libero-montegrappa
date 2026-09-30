import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import NewsCard from "@/components/news/NewsCard";
import { cn } from "@/lib/utils";
import { listPublishedNews } from "@/store/news";

const MAX_ITEMS = 4;
const MOBILE_VISIBLE = 3;

export default async function LatestNews() {
	const t = await getTranslations("Homepage.latest_news");
	const news = await listPublishedNews(MAX_ITEMS);

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
					<NewsCard
						key={item.id}
						news={item}
						headingLevel="h3"
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 20vw"
						// Show the first 3 on every screen; reveal the 4th only on lg+.
						className={cn(index >= MOBILE_VISIBLE && "hidden lg:flex")}
					/>
				))}
			</div>
		</section>
	);
}
