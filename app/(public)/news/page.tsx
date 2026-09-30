import { getTranslations } from "next-intl/server";
import CreateNewsCard from "@/components/news/CreateNewsCard";
import NewsCard from "@/components/news/NewsCard";
import { constructMetadata, siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";
import {
	listAllNews,
	listPublishedNews,
	type NewsListItem,
} from "@/store/news";

export const metadata = constructMetadata({
	title: `News - ${siteConfig.name}`,
	description: "News e aggiornamenti dal Volo Libero Montegrappa",
});

export const dynamic = "force-dynamic";

export default async function NewsPage() {
	const t = await getTranslations("NewsPage");
	const user = await getSessionUser();
	const isAdmin = user?.role === "ADMIN";
	// Admins also see drafts and scheduled news, flagged on the card.
	const news = isAdmin ? await listAllNews() : await listPublishedNews();

	const badgeFor = (item: NewsListItem) => {
		if (!isAdmin) return undefined;
		if (item.draft) return t("draft");
		if (item.publishedAt > new Date()) return t("scheduled");
		return undefined;
	};

	return (
		<div>
			<div className="overflow-hidden">
				<div className="flex h-[25vh] flex-col bg-slate-50 bg-[url('/home/home1.jpg')] bg-cover bg-center">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							{t("header_title")}
						</h1>
						<h3 className="pt-2 text-center text-white">
							{t("header_description")}
						</h3>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 pt-10 pb-16">
				{news.length === 0 && !isAdmin ? (
					<div className="flex h-64 flex-col items-center justify-center">
						<p className="text-lg text-gray-500">{t("no_news")}</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{isAdmin && <CreateNewsCard />}
						{news.map((item) => (
							<NewsCard
								key={item.id}
								news={item}
								badge={badgeFor(item)}
								sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
