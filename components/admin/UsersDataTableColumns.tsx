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
import { type OnboardingStatus, onboardingStatus } from "@/helpers/onboarding";
import type { UserWithMemberships } from "@/types";
import { USER_FIELDS } from "./user-table-fields";

const STATUS_BADGE: Record<
	OnboardingStatus,
	"default" | "secondary" | "destructive" | "outline"
> = {
	complete: "outline",
	incomplete: "secondary",
	unverified: "destructive",
};

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
			meta: {
				exportLabel: "ID",
				exportValue: (user) => String(user.memberId),
			},
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
			meta: {
				exportLabel: t("header.name"),
				exportValue: (user) => `${user.firstName} ${user.lastName}`,
			},
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
			meta: {
				exportLabel: "Email",
				exportValue: (user) => user.email,
			},
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
			// Where the user stands in the signup flow: an account only counts once
			// the email is verified and the profile complete.
			id: "status",
			accessorFn: (row) => onboardingStatus(row),
			filterFn: "equalsString",
			meta: {
				exportLabel: t("header.status"),
				exportValue: (user) => t(`status.${onboardingStatus(user)}`),
			},
			header: () => <div>{t("header.status")}</div>,
			cell: ({ row }) => {
				const status = onboardingStatus(row.original);
				return (
					<Badge variant={STATUS_BADGE[status]} className="whitespace-nowrap">
						{t(`status.${status}`)}
					</Badge>
				);
			},
		},
		{
			// Accessed through `isSocio` rather than off `user.role`, so the filter,
			// the badge below and the Excel export all answer the same question:
			// does this user hold a membership for the current year.
			id: "role",
			accessorFn: (row) => (isSocio(row) ? "MEMBER" : "USER"),
			filterFn: "equalsString",
			meta: {
				exportLabel: t("header.role"),
				exportValue: (user) =>
					isSocio(user) ? t("role.member") : t("role.user"),
			},
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
			meta: {
				exportLabel: t("header.created_at"),
				exportValue: (user) => format(user.createdAt, "dd/MM/yyyy HH:mm"),
			},
			header: () => <div>{t("header.created_at")}</div>,
			cell: ({ row }) => {
				const date = format(row.getValue("createdAt"), "dd/MM/yyyy");
				return <div className="font-medium">{date}</div>;
			},
		},
		// Everything the admin can switch on from the column menu. Generated from
		// one registry so a field cannot appear in the table without also being
		// filterable and exportable.
		...USER_FIELDS.map<ColumnDef<UserWithMemberships>>((field) => ({
			id: field.id,
			accessorFn: field.value,
			meta: {
				exportLabel: t(field.label),
				exportValue: field.value,
			},
			header: ({ column }) => (
				<Button
					variant="ghost"
					className="m-0 p-0"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{t(field.label)}
					<ArrowUpDown className="ml-2 size-4" />
				</Button>
			),
			cell: ({ row }) => (
				<div className="whitespace-nowrap">{field.value(row.original)}</div>
			),
		})),
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
