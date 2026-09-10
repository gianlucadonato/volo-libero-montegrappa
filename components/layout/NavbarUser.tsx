"use client";
import { LogIn, LogOut, NotebookPen, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navUserLinks } from "@/config/sidebar-links";
import { useAuthHref } from "@/hooks/use-auth-href";
import { authClient } from "@/lib/auth-client";

export function NavbarUser() {
	const t = useTranslations("NavMain");
	const { data: session } = authClient.useSession();
	const router = useRouter();
	const signOut = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/login"); // redirect to login page
				},
			},
		});
	};

	if (session) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="relative size-8 rounded-full">
						<Avatar className="size-8">
							<AvatarImage
								src={session.user?.image ?? ""}
								alt={session.user?.firstName ?? ""}
							/>
							<AvatarFallback>
								{session.user?.firstName?.[0]}
								{session.user?.lastName?.[0]}
							</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="z-200 w-56" align="end" forceMount>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium leading-none">
								{session.user?.firstName} {session.user?.lastName}
							</p>
							<p className="text-xs leading-none text-muted-foreground">
								{session.user?.email}
							</p>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						{navUserLinks.map((link) => {
							if (link.items?.length) {
								return (
									<DropdownMenuSub key={link.title}>
										<DropdownMenuSubTrigger>
											{link.icon && <link.icon className="mr-2 size-4" />}
											{t(link.title)}
										</DropdownMenuSubTrigger>
										<DropdownMenuPortal>
											<DropdownMenuSubContent>
												{link.items.map((subitem) => (
													<DropdownMenuItem key={subitem.title}>
														{subitem.icon && (
															<subitem.icon className="mr-2 size-4" />
														)}
														{t(subitem.title)}
													</DropdownMenuItem>
												))}
											</DropdownMenuSubContent>
										</DropdownMenuPortal>
									</DropdownMenuSub>
								);
							}
							return (
								<Link href={link.url} key={link.title}>
									<DropdownMenuItem>
										{link.icon && <link.icon className="mr-2 size-4" />}
										{t(link.title)}
									</DropdownMenuItem>
								</Link>
							);
						})}
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => signOut()}>
						<LogOut className="mr-2 size-4" />
						Log out
						<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	} else {
		return <NavbarUnlogged />;
	}
}

function NavbarUnlogged() {
	const t = useTranslations("NavMobile");
	// Both links come back to the page the user was reading.
	const { loginHref, signupHref } = useAuthHref();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative size-8 rounded-full">
					<Avatar className="size-8">
						<AvatarFallback>
							<User className="size-4" />
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="z-200 w-56" align="end" forceMount>
				<DropdownMenuGroup>
					<Link href={loginHref} className="w-full">
						<DropdownMenuItem className="flex w-full items-center">
							<LogIn className="mr-2 size-4" />
							<span>Login</span>
						</DropdownMenuItem>
					</Link>
					<Link href={signupHref} className="w-full">
						<DropdownMenuItem className="flex w-full items-center">
							<NotebookPen className="mr-2 size-4" />
							<span>{t("signup")}</span>
						</DropdownMenuItem>
					</Link>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
