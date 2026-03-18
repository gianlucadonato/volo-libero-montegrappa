"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { PaymentWithUser } from "@/types";

export default function UsersDataTableColumns() {
	const t = useTranslations("PaymentsPage");

	const columns: ColumnDef<PaymentWithUser>[] = [
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
			accessorKey: "fullName",
			header: t("header.name"),
			accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`,
			cell: ({ row }) => {
				return (
					<Link href={`/admin/users/${row.original.user.id}`}>
						<div className="capitalize">{row.getValue("fullName")}</div>
					</Link>
				);
			},
		},
		{
			accessorKey: "paymentMethod",
			header: () => (
				<div className="text-right">{t("header.paymentMethod")}</div>
			),
			cell: ({ row }) => {
				const paymentMethod = String(row.getValue("paymentMethod"));

				return <div className="text-right font-medium">{t(paymentMethod)}</div>;
			},
		},
		{
			accessorKey: "amount",
			header: () => <div className="text-right">{t("header.amount")}</div>,
			cell: ({ row }) => {
				return (
					<div className="text-right font-medium">
						{Number(row.getValue("amount")) / 100} €
					</div>
				);
			},
		},
		{
			accessorKey: "description",
			header: () => <div className="text-right">{t("header.description")}</div>,
			cell: ({ row }) => {
				return (
					<div className="text-right font-medium">
						{row.getValue("description")}
					</div>
				);
			},
		},
		{
			accessorKey: "note",
			header: () => <div className="text-right">{t("header.note")}</div>,
			cell: ({ row }) => {
				return (
					<div className="text-right font-medium">{row.getValue("note")}</div>
				);
			},
		},
		{
			accessorKey: "createdBy",
			header: t("header.createdBy"),
			accessorFn: (row) =>
				row.creator
					? `${row.creator?.firstName} ${row.creator?.lastName}`
					: null,
			cell: ({ row }) => {
				return (
					<Link href={`/admin/users/${row.original.creator?.id}`}>
						<div className="capitalize">
							{row.getValue("createdBy") || null}
						</div>
					</Link>
				);
			},
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						{t("header.createdAt")}
						<ArrowUpDown className="ml-2 size-4" />
					</Button>
				);
			},
			cell: ({ row }) => {
				const date = format(row.getValue("createdAt"), "dd/MM/yyyy HH:mm");
				return <div className="text-right font-medium">{date}</div>;
			},
		},
	];
	return columns;
}
