import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { DeleteAccountSection } from "@/components/settings/delete-account";
import { LanguageSettings } from "@/components/settings/language-settings";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { constructMetadata, siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
	title: `Settings - ${siteConfig.name}`,
	description: "Configure your account and website settings.",
});

export default async function SettingsPage() {
	const t = await getTranslations("SettingsPage");
	const user = await getSessionUser();
	if (!user?.id) redirect("/login");

	return (
		<div className="container mx-auto mt-10">
			<DashboardHeader
				heading={t("header_title")}
				text={t("header_description")}
			/>
			<div className="divide-y divide-muted pb-10">
				<LanguageSettings />
				<ThemeSettings />
				<DeleteAccountSection />
			</div>
		</div>
	);
}
