import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { NewsForm } from "@/components/forms/news-form";
import { constructMetadata, siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";
import { getNewsBySlug } from "@/store/news";

export const metadata = constructMetadata({
	title: `Modifica News - ${siteConfig.name}`,
	description: "Edit a news",
});

export const dynamic = "force-dynamic";

export default async function EditNewsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const user = await getSessionUser();
	if (!user || user.role !== "ADMIN") notFound();

	const { slug } = await params;
	const news = await getNewsBySlug(slug);
	if (!news) notFound();

	const t = await getTranslations("NewNewsPage");
	return (
		<div className="container mx-auto mt-10 max-w-4xl px-4">
			<DashboardHeader
				heading={t("header_title_edit")}
				text={t("header_description_edit")}
			/>
			<div className="mt-6">
				<NewsForm news={news} />
			</div>
		</div>
	);
}
