import {
	columnFilteringFeature,
	columnVisibilityFeature,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	filterFns,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	sortFns,
	tableFeatures,
} from "@tanstack/react-table";

/**
 * What the admin and member tables can do: sort, filter, page, hide columns and
 * select rows. TanStack Table 9 only exposes the APIs of the features listed
 * here, so a table that needs more adds it to this list.
 *
 * The full built-in filter and sort registries are registered on purpose: the
 * columns rely on `"auto"` and name `"equalsString"`, and `"auto"` can only pick
 * a function that is registered.
 */
export const dataTableFeatures = tableFeatures({
	columnFilteringFeature,
	columnVisibilityFeature,
	rowSortingFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	filterFns,
	sortFns,
});

export type DataTableFeatures = typeof dataTableFeatures;
