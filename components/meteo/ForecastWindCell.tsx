import { useTranslations } from "next-intl";
import { type ForecastWind, getWindBand } from "@/lib/elmeteo-forecast-view";
import { cn } from "@/lib/utils";

/** Colours matching the bands elmeteo.it prints in its own tables. */
const bandClass = {
	calm: "text-foreground",
	moderate: "text-orange-600 dark:text-orange-400",
	strong: "text-red-600 dark:text-red-400",
} as const;

/**
 * One wind reading: direction above, speed below, gust under that when the
 * source publishes one (only the 10m column does).
 *
 * The unit is spelled out under every reading, as the source does in its own
 * cells, rather than being hoisted into the column header: the columns are wind
 * altitudes, and a pilot scrolling a phone sideways reads one cell at a time
 * with the header off-screen. It is set smaller and muted so the figure keeps
 * the weight — that is the number the band colour is warning about.
 *
 * A calm cell is a dash rather than "0 km/h": the source leaves it blank, and a
 * zero would read as a measurement rather than as the absence of one.
 */
export function ForecastWindCell({ wind }: { wind: ForecastWind | undefined }) {
	const t = useTranslations("MeteoPage.ForecastTable");

	if (!wind || wind.speedKmh === undefined) {
		return <span className="text-muted-foreground">—</span>;
	}

	const band = getWindBand(wind.speedKmh);
	const unit = (chunks: React.ReactNode) => (
		<span className="font-normal text-[0.625rem] text-muted-foreground">
			{chunks}
		</span>
	);

	return (
		<span className="inline-flex flex-col items-center leading-tight">
			{wind.direction && (
				<span className="font-medium text-[0.6875rem] text-muted-foreground">
					{wind.direction}
				</span>
			)}
			<span
				className={cn(
					"whitespace-nowrap font-semibold tabular-nums",
					bandClass[band],
				)}
			>
				{t.rich("speed", { speed: wind.speedKmh, unit })}
			</span>
			{wind.gustKmh !== undefined && (
				<span className="whitespace-nowrap text-[0.6875rem] text-muted-foreground tabular-nums">
					{t.rich("gust", { speed: wind.gustKmh, unit })}
				</span>
			)}
		</span>
	);
}
