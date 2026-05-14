import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { constructMetadata, siteConfig } from "@/config/site";
import { listNews, type NewsLocale } from "@/lib/news";

export const metadata = constructMetadata({
	title: `News - ${siteConfig.name}`,
	description: "News e aggiornamenti dal Volo Libero Montegrappa",
});

export const dynamic = "force-dynamic";

export default async function NewsPage() {
	const t = await getTranslations("NewsPage");
	const locale = ((await getLocale()) as NewsLocale) ?? "it";
	const dateLocale = locale === "en" ? enUS : itLocale;
	const news = await listNews(locale);

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
				{news.length === 0 ? (
					<div className="flex h-64 flex-col items-center justify-center">
						<p className="text-lg text-gray-500">{t("no_news")}</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{news.map((item) => (
							<Link
								key={item.slug}
								href={`/news/${item.slug}`}
								className="group flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
							>
								{item.coverImage ? (
									<div className="relative aspect-video w-full overflow-hidden bg-slate-100">
										<Image
											src={item.coverImage}
											alt={item.title}
											fill
											sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
									<h2 className="font-heading text-lg leading-snug">
										{item.title}
									</h2>
									{item.excerpt && (
										<p className="line-clamp-3 text-sm text-gray-600">
											{item.excerpt}
										</p>
									)}
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
