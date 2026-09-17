import type {
	ForecastHourView,
	ForecastTableView,
	ForecastWind,
} from "@/lib/elmeteo-forecast-view";
import { elmeteoSites, getForecastDays } from "@/lib/elmeteo-sites";
import { prisma } from "@/lib/prisma";

/**
 * The stored take-off forecasts, grouped into the 18 tables the page shows.
 *
 * Reads the three days the scraper collects rather than everything in the
 * table: a run that failed part way can leave a fourth day behind, and the
 * retention sweep only runs on the next successful report.
 *
 * Returns the tables it actually has. A take-off whose scrape failed is simply
 * absent, which the page renders as "no data for this take-off" instead of
 * blanking the whole screen — the same partial-failure stance as the scraper.
 */
export default async function getElmeteoForecasts() {
	const days = getForecastDays();

	const rows = await prisma.elmeteoForecast.findMany({
		where: { day: { in: days } },
		orderBy: [{ day: "asc" }, { hour: "asc" }],
	});

	const tables = new Map<string, ForecastTableView>();

	for (const row of rows) {
		const key = `${row.site}:${row.day}`;
		// `winds` is a JSON column, so Prisma types it as JsonValue: the shape is
		// the scraper's own `ElmeteoWind[]`, written by `saveForecast`.
		const winds = (row.winds ?? []) as ForecastWind[];

		let table = tables.get(key);
		if (!table) {
			table = {
				site: row.site,
				day: row.day,
				altitudeM: row.altitudeM,
				maxDailyCloudBaseM: row.maxDailyCloudBaseM,
				sourceUpdatedAt: row.sourceUpdatedAt?.toISOString() ?? null,
				// Taken from the first row of the table: every hour of one (site, day)
				// is written in the same transaction from the same parsed table, so
				// they all carry the same columns.
				windLabels: winds.map((wind) => wind.label),
				hours: [],
			};
			tables.set(key, table);
		}

		const hour: ForecastHourView = {
			hour: row.hour,
			cloudsHigh: row.cloudsHigh,
			cloudsMedium: row.cloudsMedium,
			cloudsLow: row.cloudsLow,
			risk: row.risk,
			temperatureC: row.temperatureC,
			precipitationMm: row.precipitationMm,
			maxFlightAltitude: row.maxFlightAltitude,
			cloudBaseMinM: row.cloudBaseMinM,
			cloudBaseMaxM: row.cloudBaseMaxM,
			thermalUpdraftsM: row.thermalUpdraftsM,
			stableLayerM: row.stableLayerM,
			winds,
		};

		table.hours.push(hour);
	}

	// Ordered by the catalogue, not by what the database happened to return, so
	// the take-off picker keeps the order the club lists its sites in.
	const bySite = elmeteoSites.map((site) => ({
		site,
		days: days
			.map((day) => tables.get(`${site.slug}:${day}`))
			.filter((table): table is ForecastTableView => table !== undefined),
	}));

	const scrapedAt = rows.reduce<Date | null>(
		(latest, row) =>
			latest === null || row.scrapedAt > latest ? row.scrapedAt : latest,
		null,
	);

	return {
		days,
		sites: bySite,
		/** When the newest row was collected, for the freshness caption. */
		scrapedAt: scrapedAt?.toISOString() ?? null,
	};
}

export type ElmeteoForecasts = Awaited<ReturnType<typeof getElmeteoForecasts>>;
