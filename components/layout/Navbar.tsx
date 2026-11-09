"use client";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { navbarLinks } from "@/config/sidebar-links";
import { cn } from "@/lib/utils";
import type { UserRole } from "../../prisma/generated/enums";
import LocaleSwitcher from "./locale-switcher";
import { NavbarUser } from "./NavbarUser";

type NavMainItem = {
	title: string;
	url: string;
	target?: string;
	image?: string;
	description?: string;
	icon?: LucideIcon;
	isActive?: boolean;
	disabled?: boolean;
	authorizeOnly?: UserRole[];
	hidden?: boolean;
	items?: NavMainItem[];
};

export default function Navbar() {
	const t = useTranslations("NavMain");
	return (
		<section className="w-full bg-white py-4">
			<div className="px-4">
				<nav className="flex items-center justify-between">
					<div className="flex items-center gap-6">
						<div className="flex items-center gap-2">
							<Link href="/">
								<Image
									src="/logo/LOGO_COLOR.png"
									alt="Logo VLM"
									width={184}
									height={39}
								/>
							</Link>
						</div>
						<div className="hidden items-center lg:flex">
							{(navbarLinks as NavMainItem[]).map((navbarLink) => {
								if (navbarLink.hidden) return null;
								if (navbarLink.image) {
									return (
										<NavigationMenu key={navbarLink.title}>
											<NavigationMenuList>
												<NavbarMenuItem item={navbarLink} />
											</NavigationMenuList>
										</NavigationMenu>
									);
								}
								if (navbarLink.items) {
									return (
										<NavigationMenu key={navbarLink.title}>
											<NavigationMenuList>
												<NavigationMenuItem className="text-muted-foreground">
													<NavigationMenuTrigger>
														<span className="uppercase">
															{t(navbarLink.title)}
														</span>
													</NavigationMenuTrigger>
													<NavigationMenuContent>
														<ul className="w-80 p-2">
															{navbarLink.items.map((item, idx) => (
																<NavigationMenuLink href={item.url} key={idx}>
																	<li className="flex select-none gap-4 rounded-md p-1 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
																		{item.icon && (
																			<item.icon className="size-5 shrink-0" />
																		)}
																		<div>
																			<div className="text-sm font-semibold">
																				{t(item.title)}
																			</div>
																			<p className="text-sm leading-snug text-muted-foreground">
																				{item.description &&
																					t(item.description)}
																			</p>
																		</div>
																	</li>
																</NavigationMenuLink>
															))}
														</ul>
													</NavigationMenuContent>
												</NavigationMenuItem>
											</NavigationMenuList>
										</NavigationMenu>
									);
								}
								return (
									<Link
										className={cn(
											"uppercase",
											navigationMenuTriggerStyle,
											buttonVariants({ variant: "ghost" }),
										)}
										href={navbarLink.url}
										key={navbarLink.title}
									>
										{t(navbarLink.title)}
									</Link>
								);
							})}
						</div>
					</div>
					<div className="hidden flex-1 items-center space-x-4 sm:justify-end lg:flex">
						<div className="flex space-x-4">
							<NavbarUser />
						</div>
						<div className="flex space-x-4">
							<LocaleSwitcher />
						</div>
					</div>
				</nav>
			</div>
		</section>
	);
}

// Module level: defined inside NavbarMenuItem it was a new component type on
// every render, so React remounted the submenu items each time.
function ListItem({ item }: { item: NavMainItem }) {
	const t = useTranslations("NavMain");
	if (item.hidden) return null;
	return (
		<li>
			<NavigationMenuLink asChild>
				<a
					href={item.url}
					target={item.target ?? "_self"}
					title={t(item.title)}
					className="flex flex-col justify-start items-start select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
				>
					<div className="flex items-center justify-start gap-2 text-sm font-medium leading-none">
						{item.icon && <item.icon className="size-5 shrink-0" />}
						{t(item.title)}
					</div>
					<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
						{item.description}
					</p>
				</a>
			</NavigationMenuLink>
		</li>
	);
}

function NavbarMenuItem({ item }: { item: NavMainItem }) {
	const t = useTranslations("NavMain");

	return (
		<NavigationMenuItem>
			<NavigationMenuTrigger>
				<span className="uppercase">{t(item.title)}</span>
			</NavigationMenuTrigger>
			<NavigationMenuContent>
				<ul className="grid gap-3 p-2 sm:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
					<li className="row-span-3">
						<NavigationMenuLink asChild>
							<Link
								className={cn(
									"flex p-0 size-full select-none flex-col justify-end overflow-hidden rounded-md bg-linear-to-b from-muted/50 to-muted no-underline outline-none focus:shadow-md",
									"bg-[url('/bg-home.jpg')] bg-cover bg-left",
								)}
								href={item.url}
							>
								<div
									style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
									className="flex size-full flex-col justify-end p-6 "
								>
									<div className="mb-2 mt-4 font-heading text-lg font-medium uppercase text-white">
										{t(item.title)}
									</div>
									<p className="text-sm leading-tight text-white">
										{item.description && t(item.description)}
									</p>
								</div>
							</Link>
						</NavigationMenuLink>
					</li>
					{item.items?.map((item) => (
						<ListItem key={item.title} item={item} />
					))}
				</ul>
			</NavigationMenuContent>
		</NavigationMenuItem>
	);
}
