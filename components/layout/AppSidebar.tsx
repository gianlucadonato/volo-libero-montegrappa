"use client";

import type * as React from "react";
import { NavAuth } from "@/components/layout/nav-auth";
import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarRail,
} from "@/components/ui/sidebar";
import { sidebarLinks } from "@/config/sidebar-links";
import { authClient } from "@/lib/auth-client";
import { UserRole } from "@/prisma/generated/enums";
import type { NavMainItem } from "@/types";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
	const { data: session } = authClient.useSession();
	type SidebarSection = keyof typeof sidebarLinks;
	const currentRole = session?.user?.role;

	const filteredLinks = (Object.keys(sidebarLinks) as SidebarSection[]).reduce(
		(acc, section) => {
			acc[section] = sidebarLinks[section].filter(
				({ authorizeOnly }) =>
					!authorizeOnly ||
					(currentRole !== undefined && authorizeOnly.includes(currentRole)) ||
					(currentRole === UserRole.ADMIN &&
						authorizeOnly.includes(UserRole.ADMIN)),
			);
			return acc;
		},
		{} as Record<SidebarSection, NavMainItem[]>,
	);

	return (
		<Sidebar {...props}>
			<SidebarContent>
				<NavMain items={filteredLinks.menu} groupLabel={"Menu"} />
				{Boolean(filteredLinks.options?.length) && (
					<NavMain items={filteredLinks.options} groupLabel={"Admin"} />
				)}
				{!session?.user && <NavAuth />}
			</SidebarContent>
			<SidebarFooter>{session?.user && <NavUser />}</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
