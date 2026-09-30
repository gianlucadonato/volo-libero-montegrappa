"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import Flag from "react-flagpack";
import { SectionColumns } from "@/components/dashboard/section-columns";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type Locale, localeFlags, locales } from "@/i18n/config";
import { setUserLocale } from "@/i18n/locale";
import { Button } from "../ui/button";

export function LanguageSettings() {
	const t = useTranslations("LocaleSwitcher");
	const locale = useLocale();
	const [_, startTransition] = useTransition();

	function onSelect(value: string) {
		const locale = value as Locale;
		startTransition(() => {
			setUserLocale(locale);
		});
	}

	return (
		<SectionColumns
			title={t("settings.title")}
			description={t("settings.description")}
		>
			<div className="flex w-full items-center justify-between gap-2">
				<div className="flex-1">
					<Select defaultValue={locale} onValueChange={onSelect}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={t("select_language")} />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{locales.map((value) => (
									<SelectItem key={value} value={value}>
										{t(value)}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Button variant="outline">
						<Flag
							code={localeFlags[locale as Locale]}
							size="l"
							hasBorder={false}
							className="mt-1 size-4"
						/>
					</Button>
				</div>
			</div>
		</SectionColumns>
	);
}
