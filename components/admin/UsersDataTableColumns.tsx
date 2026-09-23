"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isSocio } from "@/helpers/isSocio";
import type { UserWithMemberships } from "@/types";

export default function UsersDataTableColumns({
	setOpen,
	setDialogUser,
}: {
	setOpen: (open: boolean) => void;
	setDialogUser: (user: UserWithMemberships) => void;
}) {
	const t = useTranslations("UsersDataTable");

	const columns: ColumnDef<UserWithMemberships>[] = [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label={t("select_all")}
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label={t("select_row")}
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "memberId",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						className="m-0 p-0"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						ID
						<ArrowUpDown className="ml-2 size-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="lowercase">{row.getValue("memberId")}</div>
			),
		},
		{
			accessorKey: "fullName",
			header: t("header.name"),
			accessorFn: (row) => `${row.firstName} ${row.lastName}`,
			cell: ({ row }) => {
				return (
					<Link href={`/admin/users/${row.original.id}`}>
						<div className="capitalize">{row.getValue("fullName")}</div>
					</Link>
				);
			},
		},
		{
			accessorKey: "email",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Email
						<ArrowUpDown className="ml-2 size-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="lowercase">{row.getValue("email")}</div>
			),
		},
		{
			// Filtered on what the badge says rather than on `user.role`. The role
			// column is a current-state flag that has drifted from the memberships
			// it is supposed to track, so filtering on it selected users the table
			// itself renders as non-members, and dropped the admins it renders as
			// members. Keyed on `isSocio` instead, the filter, the badge and the
			// Excel export all agree on who is a member.
			id: "role",
			accessorFn: (row) => (isSocio(row) ? "MEMBER" : "USER"),
			filterFn: "equalsString",
			header: () => <div>{t("header.role")}</div>,
			cell: ({ row }) => {
				const isMember = isSocio(row.original);
				return (
					<Badge variant={isMember ? "outline" : "default"}>
						{isMember ? t(`role.member`) : t(`role.user`)}
					</Badge>
				);
			},
		},
		{
			accessorKey: "createdAt",
			header: () => <div className="text-right">{t("header.created_at")}</div>,
			cell: ({ row }) => {
				const date = format(row.getValue("createdAt"), "dd/MM/yyyy");
				return <div className="text-right font-medium">{date}</div>;
			},
		},
		{
			id: "actions",
			enableHiding: false,
			cell: ({ row }) => {
				const user = row.original;
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="size-8 p-0">
								<span className="sr-only">{t("open_menu")}</span>
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
							{!isSocio(user) && (
								<DropdownMenuItem
									onClick={() => {
										setOpen(true);
										setDialogUser(user);
									}}
								>
									{t("insert_member")}
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							<Link href={`/admin/users/${user.id}`}>
								<DropdownMenuItem>{t("details")}</DropdownMenuItem>
							</Link>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
	return columns;
}
