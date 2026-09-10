"use client";

import { LogIn, NotebookPen } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useAuthHref } from "@/hooks/use-auth-href";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { NavMainItem } from "@/types";

export function NavAuth() {
	const t = useTranslations("NavAuth");
	const { isMobile } = useMediaQuery();
	const { setOpenMobile } = useSidebar();
	// Both entries come back to the page the user was reading.
	const { loginHref, signupHref } = useAuthHref();

	const items: NavMainItem[] = [
		{
			title: "login",
			url: loginHref,
			icon: LogIn,
		},
		{
			title: "signup",
			url: signupHref,
			icon: NotebookPen,
		},
	];

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{t("access")}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					return (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton asChild>
								<Link
									href={item.disabled ? "#" : item.url}
									className={cn(
										item.disabled && "cursor-not-allowed opacity-80",
									)}
									onClick={() =>
										isMobile && !item.disabled && setOpenMobile(false)
									}
								>
									{item.icon && <item.icon />}
									<span>{t(item.title)}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
