import type { RowData } from "@tanstack/react-table";

import type { UserWithMemberships } from "@/types";

/**
 * A `UserSchema` field the admin can pull into the users table.
 *
 * One entry drives three things at once — the column, its checkbox in the
 * column menu, and its column in the Excel export — so the spreadsheet cannot
 * drift away from the table the way the old hardcoded field list did.
 *
 * Columns that need more than text (the row checkbox, the name link, the
 * membership badge, the row actions) are written out by hand in
 * `UsersDataTableColumns` instead; they carry the same `meta` so the export
 * reads them identically.
 */
export type UserField = {
	/** Column id, and the key the table sorts and filters on. */
	id: string;
	/** Message key, under the `UsersDataTable` namespace. */
	label: string;
	/** The cell's text. Empty for a field the user never filled in. */
	value: (user: UserWithMemberships) => string;
};

const text = (value: string | null | undefined) => value ?? "";

export const USER_FIELDS: UserField[] = [
	// The table shows one "Nome" column, but the spreadsheet used to carry the
	// two halves separately and a mail merge still wants them that way, so they
	// stay available a checkbox away.
	{
		id: "firstName",
		label: "header.first_name",
		value: (user) => user.firstName,
	},
	{
		id: "lastName",
		label: "header.last_name",
		value: (user) => user.lastName,
	},
	{
		id: "phone",
		label: "header.phone",
		value: (user) => text(user.phone),
	},
	{
		id: "city",
		label: "header.city",
		value: (user) => text(user.city),
	},
	{
		id: "sport",
		label: "header.sport",
		value: (user) => text(user.sport),
	},
	{
		id: "vdsNumber",
		label: "header.vds_number",
		value: (user) => text(user.vdsNumber),
	},
	{
		id: "fiscalCode",
		label: "header.fiscal_code",
		value: (user) => text(user.fiscalCode),
	},
	{
		id: "dateOfBirth",
		label: "header.date_of_birth",
		value: (user) => text(user.dateOfBirth),
	},
	{
		id: "placeOfBirth",
		label: "header.place_of_birth",
		value: (user) => text(user.placeOfBirth),
	},
	{
		id: "streetAddress",
		label: "header.street_address",
		value: (user) => text(user.streetAddress),
	},
	{
		id: "zipCode",
		label: "header.zip_code",
		value: (user) => text(user.zipCode),
	},
	{
		id: "province",
		label: "header.province",
		value: (user) => text(user.province),
	},
	{
		id: "state",
		label: "header.state",
		value: (user) => text(user.state),
	},
	{
		id: "gender",
		label: "header.gender",
		value: (user) => text(user.gender),
	},
	{
		id: "size",
		label: "header.size",
		value: (user) => text(user.size),
	},
	{
		id: "vdsReleaseDate",
		label: "header.vds_release_date",
		value: (user) => text(user.vdsReleaseDate),
	},
	{
		id: "fivlNumber",
		label: "header.fivl_number",
		value: (user) => text(user.fivlNumber),
	},
	{
		id: "medicalExamValidDate",
		label: "header.medical_exam_valid_date",
		value: (user) => text(user.medicalExamValidDate),
	},
	{
		id: "xcontestId",
		label: "header.xcontest_id",
		value: (user) => text(user.xcontestId),
	},
	{
		id: "ognCallsign",
		label: "header.ogn_callsign",
		value: (user) => text(user.ognCallsign),
	},
	{
		id: "ognHex",
		label: "header.ogn_hex",
		value: (user) => text(user.ognHex),
	},
];

/**
 * Where the column menu starts. Every registry field is off, so the table
 * opens on the columns it always had — id, name, email, membership, signup
 * date and the actions menu — and the admin turns on what the job at hand
 * needs. Spelling the `false`s out is what keeps them hidden: a column the
 * visibility state says nothing about is one the table shows.
 */
export const DEFAULT_FIELD_VISIBILITY: Record<string, boolean> =
	Object.fromEntries(USER_FIELDS.map((field) => [field.id, false]));

/**
 * Projects the table onto a spreadsheet: one row per row left by the filters,
 * one column per field the admin switched on, in the order they sit on screen.
 *
 * Kept apart from the component so the sheet is a value that can be asserted
 * against rather than a side effect of a download.
 */
export function toExportRows(
	columns: ExportableColumn[],
	users: UserWithMemberships[],
) {
	return users.map((user) =>
		Object.fromEntries(
			columns.map((column) => [column.exportLabel, column.exportValue(user)]),
		),
	);
}

/** A column that knows how to render itself into a spreadsheet cell. */
export type ExportableColumn = {
	exportLabel: string;
	exportValue: (user: UserWithMemberships) => string;
};

/**
 * Drops the columns that carry no spreadsheet identity — the row checkbox and
 * the actions menu — and narrows the rest to a shape the export can rely on.
 */
export function exportableColumns(
	metas: (ExportableColumn | Partial<ExportableColumn> | undefined)[],
) {
	return metas.filter(
		(meta): meta is ExportableColumn =>
			typeof meta?.exportLabel === "string" &&
			typeof meta?.exportValue === "function",
	);
}

declare module "@tanstack/react-table" {
	// Carries a column's Excel identity alongside its on-screen one, so the
	// export can walk the visible columns instead of keeping its own list of
	// fields — the two used to drift apart.
	interface ColumnMeta<TData extends RowData, TValue> {
		exportLabel?: string;
		exportValue?: (user: UserWithMemberships) => string;
	}
}
