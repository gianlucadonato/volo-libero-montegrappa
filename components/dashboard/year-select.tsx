"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

/**
 * Season picker for the dashboard.
 *
 * The selected year arrives as a prop rather than being read from the query
 * string here: the page it sits on is a server component that already resolves
 * the parameter, and reading it again on the client would force this into a
 * Suspense boundary for a value it has been handed.
 *
 * Shown even when the club has only one season on record, unlike the XC edition
 * picker: on an admin page the year the figures belong to should always be
 * readable, not just changeable.
 */
export function YearSelect({ year, years }: { year: number; years: number[] }) {
	const t = useTranslations("AdminPage");
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleYearChange = (value: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set("year", value);
		// `replace`, so flicking through seasons does not bury the page the admin
		// arrived from under a stack of history entries.
		router.replace(`/admin?${next.toString()}`, { scroll: false });
	};

	return (
		<Select value={String(year)} onValueChange={handleYearChange}>
			<SelectTrigger className="w-36" aria-label={t("select_year")}>
				<SelectValue placeholder={t("select_year")} />
			</SelectTrigger>
			<SelectContent>
				{years.map((value) => (
					<SelectItem key={value} value={String(value)}>
						{t("season", { year: value })}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
