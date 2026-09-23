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
import { NEXT_YEAR } from "@/config/constants";
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
		// in the spreadsheet — not every user in the club. The page filters on
		// name, email and membership, which are written out by hand in
		// `UsersDataTableColumns`; a registry column stands in for them here
		// because the row model treats the two the same.
		const rows = sheetFor(
			buildTable(data, [{ id: "city", value: "Treviso" }], {
				...DEFAULT_FIELD_VISIBILITY,
				city: true,
			}),
		);
		expect(rows).toHaveLength(1);
		expect(rows[0].city).toBe("Treviso");
	});

	it("carries only the columns the admin switched on", () => {
		// None, to begin with: the table opens on its fixed columns, and the
		// optional fields are each a checkbox away.
		expect(sheetFor(buildTable(data))).toEqual([{}, {}]);

		const rows = sheetFor(
			buildTable(data, [], { ...DEFAULT_FIELD_VISIBILITY, city: true }),
		);
		expect(Object.keys(rows[0])).toEqual(["city"]);
	});

	it("picks up a column the moment it is added to the table", () => {
		const rows = sheetFor(
			buildTable(data, [], { ...DEFAULT_FIELD_VISIBILITY, fiscalCode: true }),
		);
		expect(Object.keys(rows[0])).toContain("fiscalCode");
	});

	it("drops a column the moment it is hidden", () => {
		const shown = { ...DEFAULT_FIELD_VISIBILITY, city: true };
		expect(Object.keys(sheetFor(buildTable(data, [], shown))[0])).toContain(
			"city",
		);

		const rows = sheetFor(buildTable(data, [], { ...shown, city: false }));
		expect(Object.keys(rows[0])).not.toContain("city");
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

	it("dates the renewal from the row, not from when it says it runs", () => {
		// `validFrom` is the moment of payment for a Stripe membership but a
		// nominal 1 January for one an admin enters by hand, so only `createdAt`
		// carries the real date down both paths.
		const renewedAt = USER_FIELDS.find((field) => field.id === "renewedAt");
		const member = user({
			memberships: [
				{
					year: NEXT_YEAR,
					createdAt: new Date("2026-03-04T17:30:00.000Z"),
					validFrom: new Date("2026-01-01T00:00:00.000Z"),
				},
			],
		} as Partial<UserWithMemberships>);
		expect(renewedAt?.value(member)).toBe("04/03/2026");
	});

	it("leaves the renewal date blank for a user who has not renewed", () => {
		const renewedAt = USER_FIELDS.find((field) => field.id === "renewedAt");
		expect(renewedAt?.value(user({ memberships: [] }))).toBe("");
	});

	it("renders a field the user never filled in as an empty cell", () => {
		// `null` would reach the sheet as the string "null"; blank is what an
		// admin reading a column of fiscal codes expects.
		const fiscalCode = USER_FIELDS.find((field) => field.id === "fiscalCode");
		expect(fiscalCode?.value(user({ fiscalCode: null }))).toBe("");
	});

	it("opens on the columns the table always had", () => {
		// Twenty-odd columns at once is not a table anyone can use. The optional
		// fields all start off, leaving id, name, email, membership, signup date
		// and the actions menu — the table as it read before the column menu
		// existed.
		expect(Object.values(DEFAULT_FIELD_VISIBILITY).filter(Boolean)).toEqual([]);
		// And every field is listed, because a field the state omits is a field
		// the table would show.
		expect(Object.keys(DEFAULT_FIELD_VISIBILITY).sort()).toEqual(
			USER_FIELDS.map((field) => field.id).sort(),
		);
	});
});
