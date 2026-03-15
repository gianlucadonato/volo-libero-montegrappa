"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { navUserLinks } from "@/config/sidebar-links";
import { authClient } from "@/lib/auth-client";
import { UserRole } from "@/prisma/generated/enums";

export function NavUser() {
  const { isMobile, setOpenMobile } = useSidebar();
  const t = useTranslations("NavMain");

  const { data: session } = authClient.useSession();
  const currentRole = session?.user?.role;
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

  const filteredLinks = navUserLinks.filter(
    ({ authorizeOnly }) =>
      !authorizeOnly ||
      (currentRole !== undefined && authorizeOnly.includes(currentRole)) ||
      (currentRole === UserRole.ADMIN &&
        authorizeOnly.includes(UserRole.ADMIN)),
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage
                  src={session?.user.image ?? undefined}
                  alt={session?.user.firstName}
                />
                <AvatarFallback className="rounded-lg">
                  <span className="capitalize">
                    {session?.user.firstName[0]}
                  </span>
                  <span className="capitalize">
                    {session?.user.lastName?.[0]}
                  </span>
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {session?.user.firstName} {session?.user.lastName}
                </span>
                <span className="truncate text-xs">{session?.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage
                    src={session?.user.image ?? undefined}
                    alt={session?.user.firstName}
                  />
                  <AvatarFallback className="rounded-lg">
                    <span className="capitalize">
                      {session?.user.firstName[0]}
                    </span>
                    <span className="capitalize">
                      {session?.user.lastName?.[0]}
                    </span>
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {session?.user.firstName} {session?.user.lastName}
                  </span>
                  <span className="truncate text-xs">
                    {session?.user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              {filteredLinks.map((link) => {
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
                  <Link
                    href={link.url}
                    onClick={() => isMobile && setOpenMobile(false)}
                    key={link.title}
                  >
                    <DropdownMenuItem>
                      {link.icon && <link.icon className="mr-2 size-4" />}
                      {t(link.title)}
                    </DropdownMenuItem>
                  </Link>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(event) => {
                event.preventDefault();
                signOut();
              }}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
