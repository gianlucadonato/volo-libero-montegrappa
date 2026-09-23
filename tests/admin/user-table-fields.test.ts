import {
	type ColumnDef,
	type ColumnFiltersState,
	createTable,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	type VisibilityState,
} from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import {
	DEFAULT_FIELD_VISIBILITY,
	exportableColumns,
	toExportRows,
	USER_FIELDS,
	type UserField,
} from "@/components/admin/user-table-fields";
import type { UserWithMemberships } from "@/types";

const user = (over: Partial<UserWithMemberships>) =>
	({
		id: "u",
		memberId: 1,
		email: "anna@example.it",
		firstName: "Anna",
		lastName: "Rossi",
		city: "Bassano",
		phone: "3330000000",
		sport: "paragliding",
		vdsNumber: "77984",
		fiscalCode: null,
		memberships: [],
		createdAt: new Date("2026-01-15T10:00:00.000Z"),
		...over,
	}) as UserWithMemberships;

/**
 * The real table, minus React: the same row models the page runs on, fed the
 * same registry, so what the assertions see is what an admin would download.
 */
function buildTable(
	data: UserWithMemberships[],
	columnFilters: ColumnFiltersState = [],
	columnVisibility: VisibilityState = DEFAULT_FIELD_VISIBILITY,
) {
	const columns: ColumnDef<UserWithMemberships>[] = USER_FIELDS.map(
		(field: UserField) => ({
			id: field.id,
			accessorFn: field.value,
			meta: { exportLabel: field.id, exportValue: field.value },
		}),
	);
	let state = { columnFilters, columnVisibility, sorting: [] };
	const table = createTable<UserWithMemberships>({
		data,
		columns,
		state,
		onStateChange: () => {},
		renderFallbackValue: null,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});
	state = { ...table.initialState, ...state };
	table.setOptions((previous) => ({ ...previous, state }));
	return table;
}

/** What `downloadExcel` hands to the xlsx writer. */
const sheetFor = (table: ReturnType<typeof buildTable>) =>
	toExportRows(
		exportableColumns(
			table.getVisibleFlatColumns().map((column) => column.columnDef.meta),
		),
		table.getSortedRowModel().rows.map((row) => row.original),
	);

describe("the exported sheet follows the table", () => {
	const data = [
		user({ id: "1", city: "Bassano" }),
		user({ id: "2", city: "Treviso" }),
	];

	it("carries only the rows a filter left behind", () => {
		// The whole point of the feature: filter the table, get that filtered set
		// in the spreadsheet — not every user in the club.
		const rows = sheetFor(buildTable(data, [{ id: "city", value: "Treviso" }]));
		expect(rows).toHaveLength(1);
		expect(rows[0].city).toBe("Treviso");
	});

	it("carries only the columns the admin switched on", () => {
		const rows = sheetFor(buildTable(data));
		expect(Object.keys(rows[0])).toEqual([
			"phone",
			"city",
			"sport",
			"vdsNumber",
		]);
	});

	it("picks up a column the moment it is added to the table", () => {
		const rows = sheetFor(
			buildTable(data, [], { ...DEFAULT_FIELD_VISIBILITY, fiscalCode: true }),
		);
		expect(Object.keys(rows[0])).toContain("fiscalCode");
	});

	it("drops a column the moment it is hidden", () => {
		const rows = sheetFor(
			buildTable(data, [], { ...DEFAULT_FIELD_VISIBILITY, city: false }),
		);
		expect(Object.keys(rows[0])).not.toContain("city");
	});

	it("filters on a column the admin has just added", () => {
		// A newly shown field is not decoration: it gets its own filter box, and
		// narrowing by it must reach the spreadsheet like any other filter.
		const rows = sheetFor(
			buildTable(
				[user({ id: "1", province: "VI" }), user({ id: "2", province: "TV" })],
				[{ id: "province", value: "VI" }],
				{ ...DEFAULT_FIELD_VISIBILITY, province: true },
			),
		);
		expect(rows).toHaveLength(1);
		expect(rows[0].province).toBe("VI");
	});
});

describe("exportableColumns", () => {
	it("leaves out the columns that are not data", () => {
		// The row checkbox and the actions menu are chrome; they would otherwise
		// land in the spreadsheet as empty columns.
		expect(
			exportableColumns([undefined, {}, { exportLabel: "City" }]),
		).toHaveLength(0);
	});
});

describe("the field registry", () => {
	it("gives every field a label and a reader", () => {
		for (const field of USER_FIELDS) {
			expect(field.label, field.id).toMatch(/^header\./);
			expect(typeof field.value, field.id).toBe("function");
		}
	});

	it("renders a field the user never filled in as an empty cell", () => {
		// `null` would reach the sheet as the string "null"; blank is what an
		// admin reading a column of fiscal codes expects.
		const fiscalCode = USER_FIELDS.find((field) => field.id === "fiscalCode");
		expect(fiscalCode?.value(user({ fiscalCode: null }))).toBe("");
	});

	it("starts narrow enough to read", () => {
		// Twenty-odd columns at once is not a table anyone can use; the rest are a
		// checkbox away in the column menu.
		const shown = Object.values(DEFAULT_FIELD_VISIBILITY).filter(Boolean);
		expect(shown.length).toBeLessThan(6);
	});
});
