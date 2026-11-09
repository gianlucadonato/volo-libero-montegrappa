export async function exportJsonAsXlsx(
	rows: Record<string, unknown>[],
	fileName: string,
	sheetName = "Sheet1",
) {
	const xlsx = await import("@e965/xlsx");
	const workbook = xlsx.utils.book_new();
	const worksheet = xlsx.utils.json_to_sheet(rows);

	xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
	xlsx.writeFile(workbook, fileName);
}
