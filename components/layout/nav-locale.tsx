"use client";

import "react-flagpack/dist/style.css";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import Flag from "react-flagpack";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { type Locale, localeFlags, locales } from "@/i18n/config";
import { setUserLocale } from "@/i18n/locale";

/** Language picker for the sidebar, where the navbar's switcher is hidden
 * (mobile). */
export function NavLocale() {
	const t = useTranslations("LocaleSwitcher");
	const currentLocale = useLocale();
	const [isPending, startTransition] = useTransition();

	function onSelect(locale: Locale) {
		startTransition(() => {
			setUserLocale(locale);
		});
	}

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{t("label")}</SidebarGroupLabel>
			<SidebarMenu>
				{locales.map((locale) => (
					<SidebarMenuItem key={locale}>
						<SidebarMenuButton
							isActive={locale === currentLocale}
							disabled={isPending}
							onClick={() => onSelect(locale)}
						>
							<Flag
								code={localeFlags[locale]}
								size="m"
								hasBorder={false}
								className="size-4"
							/>
							<span>{t(locale)}</span>
							{locale === currentLocale && <Check className="ml-auto" />}
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
