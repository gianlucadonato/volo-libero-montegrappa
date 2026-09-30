"use client";

import { useLocale, useTranslations } from "next-intl";
import { locales } from "@/i18n/config";
import { LocaleToggle } from "./locale-toggle";

export default function LocaleSwitcher() {
	const t = useTranslations("LocaleSwitcher");
	const locale = useLocale();

	return (
		<LocaleToggle
			defaultValue={locale}
			items={locales.map((value) => ({ value, label: t(value) }))}
		/>
	);
}
