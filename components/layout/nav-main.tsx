"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { NavMainItem } from "@/types";

export function NavMain({
	items,
	groupLabel,
}: {
	items: NavMainItem[];
	groupLabel?: string;
}) {
	const t = useTranslations("NavMain");
	const { isMobile } = useMediaQuery();
	const { setOpenMobile } = useSidebar();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					if (item.hidden) return null;
					return item.items ? (
						<Collapsible
							key={item.title}
							asChild
							defaultOpen={item.isActive}
							className="group/collapsible"
						>
							<SidebarMenuItem>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton tooltip={item.title}>
										{item.icon && <item.icon />}
										<span>{t(item.title)}</span>
										<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
									</SidebarMenuButton>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items?.map((subItem) => {
											if (subItem.hidden) return null;
											return (
												<SidebarMenuSubItem key={subItem.title}>
													<SidebarMenuSubButton asChild>
														<Link
															href={subItem.url}
															className={cn(
																subItem.disabled &&
																	"cursor-not-allowed opacity-80",
															)}
															onClick={() =>
																isMobile &&
																!subItem.disabled &&
																setOpenMobile(false)
															}
														>
															{subItem.icon && <subItem.icon />}
															<span>{t(subItem.title)}</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											);
										})}
									</SidebarMenuSub>
								</CollapsibleContent>
							</SidebarMenuItem>
						</Collapsible>
					) : (
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
