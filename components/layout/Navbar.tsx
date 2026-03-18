"use client";

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
import LocaleSwitcher from "./locale-switcher";
import { NavbarUser } from "./NavbarUser";

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
							{navbarLinks.map((navbarLink) => {
								if (navbarLink.hidden) return null;
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
																				{t(item.description)}
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
