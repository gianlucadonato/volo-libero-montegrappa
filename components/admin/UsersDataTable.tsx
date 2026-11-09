"use client";

import {
	type ColumnFiltersState,
	type ColumnVisibilityState,
	flexRender,
	type SortingState,
	useTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	Download,
	Mail,
	Settings2,
	ShieldCheck,
	Smile,
	User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/extendui/button";
import { Input } from "@/components/extendui/input";
import SelectTrigger, {
	Select,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/extendui/select";
import { PaymentForm } from "@/components/forms/payment-form";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { dataTableFeatures } from "@/lib/data-table";
import { exportJsonAsXlsx } from "@/lib/export-xlsx";
import type { UserWithMemberships } from "@/types";
import UsersDataTableColumns from "./UsersDataTableColumns";
import {
	DEFAULT_FIELD_VISIBILITY,
	exportableColumns,
	toExportRows,
} from "./user-table-fields";

export default function UsersDataTable({
	data,
}: {
	data: UserWithMemberships[];
}) {
	const [sorting, setSorting] = useState<SortingState>([]);
	// No status filter by default: accounts from before email verification was
	// required are all unverified until their owners log in again, members
	// included, so hiding them would empty the table and the Excel export.
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		useState<ColumnVisibilityState>(DEFAULT_FIELD_VISIBILITY);
	const [rowSelection, setRowSelection] = useState({});
	const t = useTranslations("UsersDataTable");
	const [isDownloading, setIsDownloading] = useState(false);

	const [open, setOpen] = useState(false);
	const [dialogUser, setDialogUser] = useState<UserWithMemberships | null>(
		null,
	);

	const columns = UsersDataTableColumns({ setOpen, setDialogUser });

	const table = useTable({
		features: dataTableFeatures,
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
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
				pageIndex: 0,
				pageSize: 50, //custom default page size
			},
		},
	});

	const downloadExcel = async () => {
		setIsDownloading(true);
		try {
			const date = format(new Date(), "ddMMyyyy");

			// The sorted row model is the table as it reads on screen: every filter
			// applied, in the order the columns are sorted. Pagination is the one
			// thing it leaves out, on purpose — the export should carry the whole
			// result, not whichever 50 rows the current page happens to show.
			const rows = table.getSortedRowModel().rows;

			// Columns, likewise: the spreadsheet gets the fields the admin switched
			// on, in the order they sit in the table. The row checkbox and the
			// actions menu carry no `exportValue` and so drop out on their own.
			const columns = exportableColumns(
				table.getVisibleFlatColumns().map((column) => column.columnDef.meta),
			);

			await exportJsonAsXlsx(
				toExportRows(
					columns,
					rows.map((row) => row.original),
				),
				`vml_soci_${date}.xlsx`,
			);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div className="w-full">
			<div className="flex items-center py-4">
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent className="sm:max-w-106.25">
						<DialogHeader>
							<DialogTitle>{t("insert_payment.title")}</DialogTitle>
							<DialogDescription>
								{t("insert_payment.description")}
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="flex items-center justify-center">
								<span>
									{t("user")}: {dialogUser?.firstName} {dialogUser?.lastName}
								</span>
							</div>
							{dialogUser && (
								<PaymentForm
									userId={dialogUser?.id}
									onSubmit={() => {
										setOpen(false);
										setDialogUser(null);
									}}
								/>
							)}
						</div>
					</DialogContent>
				</Dialog>

				<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
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
									<UserIcon />
								</Input.LeftIcon>
							</Input.Group>
						</Input>
					</div>
					<div className="col-span-1">
						<Input
							placeholder={t("filter_by_email")}
							value={
								(table.getColumn("email")?.getFilterValue() as string) ?? ""
							}
							onChange={(event) =>
								table.getColumn("email")?.setFilterValue(event.target.value)
							}
							className="w-full"
						>
							<Input.Group>
								<Input.LeftIcon>
									<Mail />
								</Input.LeftIcon>
							</Input.Group>
						</Input>
					</div>
					<div className="col-span-1">
						<Select
							value={
								(table.getColumn("role")?.getFilterValue() as string) ?? ""
							}
							onValueChange={(value) =>
								table.getColumn("role")?.setFilterValue(value)
							}
						>
							<SelectTrigger
								id="select"
								className="w-full"
								icon={<Smile size={16} strokeWidth={2} />}
							>
								<SelectValue placeholder={t("filter_by_role")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="MEMBER">{t("role.member")}</SelectItem>
								<SelectItem value="USER">{t("role.user")}</SelectItem>
								<Button
									className="flex w-full justify-start p-2 text-left text-sm"
									variant="link"
									size="sm"
									onClick={() =>
										table.getColumn("role")?.setFilterValue(undefined)
									}
								>
									{t("role.all")}
								</Button>
							</SelectContent>
						</Select>
					</div>
					<div className="col-span-1">
						<Select
							value={
								(table.getColumn("status")?.getFilterValue() as string) ?? "all"
							}
							onValueChange={(value) =>
								table
									.getColumn("status")
									?.setFilterValue(value === "all" ? undefined : value)
							}
						>
							<SelectTrigger
								className="w-full"
								icon={<ShieldCheck size={16} strokeWidth={2} />}
								aria-label={t("filter_by_status")}
							>
								<SelectValue placeholder={t("filter_by_status")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="complete">{t("status.complete")}</SelectItem>
								<SelectItem value="incomplete">
									{t("status.incomplete")}
								</SelectItem>
								<SelectItem value="unverified">
									{t("status.unverified")}
								</SelectItem>
								<SelectItem value="all">{t("status.all")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="col-span-1 flex flex-col justify-end gap-2 sm:flex-row md:col-span-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button className="w-full sm:w-auto" variant="outline">
									<Settings2 className="mr-2 size-4" />
									<span>{t("columns")}</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>{t("columns_hint")}</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<ScrollArea className="h-72">
									{table
										.getAllColumns()
										.filter((column) => column.getCanHide())
										.map((column) => (
											<DropdownMenuCheckboxItem
												key={column.id}
												checked={column.getIsVisible()}
												// Kept open so the admin can tick several fields in
												// one go rather than reopening the menu each time.
												onSelect={(event) => event.preventDefault()}
												onCheckedChange={(value) =>
													column.toggleVisibility(!!value)
												}
											>
												{column.columnDef.meta?.exportLabel ?? column.id}
											</DropdownMenuCheckboxItem>
										))}
								</ScrollArea>
							</DropdownMenuContent>
						</DropdownMenu>
						<Button
							loading={isDownloading}
							className="w-full sm:w-auto"
							variant="outline"
							onClick={downloadExcel}
						>
							<Download className="mr-2 size-4" />
							<span>{t("download_excel")}</span>
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
