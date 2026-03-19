"use client";

import {
	type ColumnDef,
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
import { ArrowUpDown, Download, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type z from "zod";
import { Button } from "@/components/extendui/button";
import { Input } from "@/components/extendui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { exportJsonAsXlsx } from "@/lib/export-xlsx";
import type { UserSchema } from "@/schemas";
import type { SessionUser } from "@/types";

type SocioType = z.infer<typeof UserSchema>;

export default function SociList({
	data,
	user,
}: {
	data: SocioType[];
	user: SessionUser;
}) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [isDownloading, setIsDownloading] = useState(false);
	const t = useTranslations("SociPage");

	const columns = SociDataTableColumns();

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
				data.map((x) => ({
					Cognome: x.lastName,
					Nome: x.firstName,
					Email: x.email,
					Sesso: x.gender,
					"Data di Nascita": x.dateOfBirth,
					"Luogo di Nascita": x.placeOfBirth,
					Indirizzo: x.streetAddress,
					Città: x.city,
					CAP: x.zipCode,
					Provincia: x.province,
					Stato: x.state,
					Telefono: x.phone,
					CodiceFiscale: x.fiscalCode,
					Taglia: x.size,
					Sport: x.sport,
					"Numero VDS": x.vdsNumber,
					"Data Rilascio VDS": x.vdsReleaseDate,
					"Numero FIVL": x.fivlNumber,
					"Data Scadenza Certificato Medico": x.medicalExamValidDate,
					"Data Iscrizione": format(x.registeredAt, "dd/MM/yyyy HH:mm"),
				})),
				`vml_iscritti_${date}.xlsx`,
			);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Card>
			<CardContent>
				<div className="w-full">
					<div className="flex items-center py-4">
						<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-4">
							<div className="col-span-1">
								<Input
									placeholder={t("search_by_name")}
									value={
										(table.getColumn("fullName")?.getFilterValue() as string) ??
										""
									}
									onChange={(event) =>
										table
											.getColumn("fullName")
											?.setFilterValue(event.target.value)
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
							{user.role === "ADMIN" && (
								<div className="col-span-1 flex justify-end md:col-span-3">
									<Button
										loading={isDownloading}
										className="w-full md:w-auto"
										variant="outline"
										onClick={downloadExcel}
									>
										<Download className="mr-2 size-4" />
										<span>Download Excel </span>
									</Button>
								</div>
							)}
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
			</CardContent>
		</Card>
	);
}

function SociDataTableColumns() {
	const t = useTranslations("SociPage");

	const columns: ColumnDef<SocioType>[] = [
		{
			accessorKey: "fullName",
			header: t("header.name"),
			accessorFn: (row) => `${row.lastName} ${row.firstName}`,
			cell: ({ row }) => {
				return <div className="capitalize">{row.getValue("fullName")}</div>;
			},
		},
		{
			accessorKey: "registeredAt",
			header: ({ column }) => {
				return (
					<div className="text-right">
						<Button
							variant="ghost"
							onClick={() =>
								column.toggleSorting(column.getIsSorted() === "asc")
							}
						>
							{t("header.registeredAt")}
							<ArrowUpDown className="ml-2 size-4" />
						</Button>
					</div>
				);
			},
			cell: ({ row }) => {
				const date = format(row.getValue("registeredAt"), "dd/MM/yyyy");
				return <div className="text-right font-medium">{date}</div>;
			},
		},
	];
	return columns;
}
