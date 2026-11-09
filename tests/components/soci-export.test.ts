import {
	type ColumnDef,
	type ColumnFiltersState,
	constructTable,
} from "@tanstack/react-table";
import { storeReactivityBindings } from "@tanstack/table-core/store-reactivity-bindings";
import { describe, expect, it } from "vitest";
import { type DataTableFeatures, dataTableFeatures } from "@/lib/data-table";

type Socio = { firstName: string; lastName: string; email: string };

const socio = (firstName: string, lastName: string): Socio => ({
	firstName,
	lastName,
	email: `${firstName}.${lastName}@example.it`.toLowerCase(),
});

// useTable supplies React reactivity; outside React the table needs its own.
const features = {
	...dataTableFeatures,
	coreReactivityFeature: storeReactivityBindings(),
};

/**
 * The `/soci` table, minus React: the same columns, filter and row models the
 * page runs on, so what the assertions see is what a member would download.
 */
function buildTable(data: Socio[], columnFilters: ColumnFiltersState = []) {
	const columns: ColumnDef<DataTableFeatures, Socio>[] = [
		{
			accessorKey: "fullName",
			accessorFn: (row) => `${row.lastName} ${row.firstName}`,
		},
	];
	return constructTable({
		features,
		data,
		columns,
		state: { columnFilters, columnVisibility: {}, sorting: [] },
	});
}

/** What `downloadExcel` walks to build the sheet. */
const exportedRows = (table: ReturnType<typeof buildTable>) =>
	table.getSortedRowModel().rows.map((row) => row.original);

describe("the soci export follows the table", () => {
	const data = [
		socio("Anna", "Rossi"),
		socio("Marco", "Bianchi"),
		socio("Luca", "Rossini"),
	];

	it("carries only the members the search box left behind", () => {
		// The bug: the download mapped the `data` prop, so searching for one
		// member still handed you the entire club.
		const rows = exportedRows(
			buildTable(data, [{ id: "fullName", value: "Ross" }]),
		);
		expect(rows.map((row) => row.lastName).sort()).toEqual([
			"Rossi",
			"Rossini",
		]);
	});

	it("carries everyone when nothing is searched for", () => {
		expect(exportedRows(buildTable(data))).toHaveLength(3);
	});

	it("carries rows beyond the current page", () => {
		// Pagination is deliberately not applied: a 50-row page must not truncate
		// a 300-member export.
		const many = Array.from({ length: 120 }, (_, index) =>
			socio(`Pilot${index}`, "Test"),
		);
		expect(exportedRows(buildTable(many))).toHaveLength(120);
	});
});
