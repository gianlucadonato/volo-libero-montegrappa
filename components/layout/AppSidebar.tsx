"use client";

import * as React from "react";
import { NavAuth } from "@/components/layout/nav-auth";
import { NavLocale } from "@/components/layout/nav-locale";
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

export function AppSidebar({
	initialRole,
	initialLoggedIn = false,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	/** Server-resolved session, used for the SSR + first client render so the
	 * sidebar doesn't hydration-mismatch against the client-only session. */
	initialRole?: UserRole;
	initialLoggedIn?: boolean;
}) {
	const { data: session } = authClient.useSession();

	// authClient.useSession() is empty on the server but reads the cached
	// session synchronously on the client's first render — which would make the
	// SSR HTML disagree with hydration. Fall back to the server-provided values
	// until we've mounted, then switch to the live (reactive) client session.
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => setMounted(true), []);

	type SidebarSection = keyof typeof sidebarLinks;
	const currentRole = mounted ? session?.user?.role : initialRole;
	const isLoggedIn = mounted ? Boolean(session?.user) : initialLoggedIn;

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
				{!isLoggedIn && <NavAuth />}
				<NavLocale />
			</SidebarContent>
			{/* NavUser reads the session client-side, so only mount it after
			    hydration to avoid rendering an empty user during SSR. */}
			<SidebarFooter>{mounted && isLoggedIn && <NavUser />}</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
