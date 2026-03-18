"use client";

import {
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Download, HandCoins, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/extendui/button";
import { Input } from "@/components/extendui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/extendui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { exportJsonAsXlsx } from "@/lib/export-xlsx";
import type { PaymentWithUser } from "@/types";

import PaymentsDataTableColumns from "./PaymentsDataTableColumns";

export default function PaymentsDataTable({
	data,
}: {
	data: PaymentWithUser[];
}) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [isDownloading, setIsDownloading] = useState(false);
	const t = useTranslations("DataTable");

	const columns = PaymentsDataTableColumns();

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
		initialState: {
			pagination: {
				pageSize: 50, //custom default page size
			},
		},
	});

	const downloadExcel = async () => {
		setIsDownloading(true);
		try {
			const date = format(new Date(), "ddMMyyyy");

			await exportJsonAsXlsx(
				data.map((payment) => ({
					Nome: payment.user.firstName,
					Cognome: payment.user.lastName,
					Email: payment.user.email,
					"Metodo Di Pagamento": payment.paymentMethod,
					"Data Iscrizione": format(payment.createdAt, "dd/MM/yyyy HH:mm"),
				})),
				`vml_iscritti_${date}.xlsx`,
			);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div className="w-full">
			<div className="flex items-center py-4">
				<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-4">
					<div className="col-span-1">
						<Input
							placeholder={t("filter_by_name")}
							value={
								(table.getColumn("fullName")?.getFilterValue() as string) ?? ""
							}
							onChange={(event) =>
								table.getColumn("fullName")?.setFilterValue(event.target.value)
							}
							className="w-full"
						>
							<Input.Group>
								<Input.LeftIcon>
									<User />
								</Input.LeftIcon>
							</Input.Group>
						</Input>
					</div>
					<div className="col-span-1">
						<Select
							value={
								(table
									.getColumn("paymentMethod")
									?.getFilterValue() as string) ?? ""
							}
							onValueChange={(value) => {
								if (value === "all")
									table.getColumn("paymentMethod")?.setFilterValue("");
								else table.getColumn("paymentMethod")?.setFilterValue(value);
							}}
						>
							<SelectTrigger
								id="select"
								className="w-full"
								icon={<HandCoins size={16} strokeWidth={2} />}
							>
								<SelectValue placeholder={t("filter_by_payment_method")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("all")}</SelectItem>
								<SelectItem value="card">{t("card")}</SelectItem>
								<SelectItem value="bank_transfer">
									{t("bank_transfer")}
								</SelectItem>
								<SelectItem value="cash">{t("cash")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="col-span-1 flex justify-end md:col-span-2">
						<Button
							loading={isDownloading}
							className="w-full md:w-auto"
							variant="outline"
							onClick={downloadExcel}
						>
							<Download className="mr-2 size-4" />
							<span>Download Excel</span>
						</Button>
					</div>
				</div>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{t("no_results")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of{" "}
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
				<div className="space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						{t("previous")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						{t("next")}
					</Button>
				</div>
			</div>
		</div>
	);
}
