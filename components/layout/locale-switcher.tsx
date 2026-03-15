"use client";

import { useLocale, useTranslations } from "next-intl";
import { LocaleToggle } from "./locale-toggle";

export default function LocaleSwitcher() {
	const t = useTranslations("LocaleSwitcher");
	const locale = useLocale();

	return (
		<LocaleToggle
			defaultValue={locale}
			items={[
				{
					value: "it",
					label: t("it"),
				},
				{
					value: "en",
					label: t("en"),
				},
			]}
		/>
	);
}
