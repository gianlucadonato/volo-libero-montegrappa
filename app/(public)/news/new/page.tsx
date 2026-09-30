import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { NewsForm } from "@/components/forms/news-form";
import { constructMetadata, siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
	title: `Nuova News - ${siteConfig.name}`,
	description: "Create a new news",
});

export default async function NewNewsPage() {
	const user = await getSessionUser();
	if (!user || user.role !== "ADMIN") notFound();

	const t = await getTranslations("NewNewsPage");
	return (
		<div className="container mx-auto mt-10 max-w-4xl px-4">
			<DashboardHeader
				heading={t("header_title")}
				text={t("header_description")}
			/>
			<div className="mt-6">
				<NewsForm />
			</div>
		</div>
	);
}
