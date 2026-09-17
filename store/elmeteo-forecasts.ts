import type { ScrapedForecast } from "@/lib/elmeteo-scraper";
import { prisma } from "@/lib/prisma";

/**
 * Persistence for scraped ElMeteo forecasts.
 *
 * Rows are keyed by (site, day, hour): the source republishes a corrected
 * forecast several times a day, and only the most recent reading for an hour
 * matters, so a re-run overwrites in place rather than accumulating duplicates.
 */

/** Rounds to a whole metre, keeping nullish values nullish. */
function toMetres(value: number | undefined) {
	return value === undefined ? null : Math.round(value);
}

export async function saveForecast({ site, day, table }: ScrapedForecast) {
	const shared = {
		altitudeM: toMetres(table.altitudeM),
		maxDailyCloudBaseM: toMetres(table.maxDailyCloudBaseM),
		sourceUpdatedAt: table.updatedAt ?? null,
		scrapedAt: new Date(),
	};

	// One transaction per (site, day): a partially written day would show pilots
	// a forecast that mixes two model runs.
	await prisma.$transaction(
		table.hours.map((entry) => {
			const data = {
				...shared,
				cloudsHigh: entry.cloudsHigh ?? null,
				cloudsMedium: entry.cloudsMedium ?? null,
				cloudsLow: entry.cloudsLow ?? null,
				risk: entry.risk ?? null,
				temperatureC: entry.temperatureC ?? null,
				precipitationMm: entry.precipitationMm ?? null,
				maxFlightAltitude: entry.maxFlightAltitude ?? null,
				cloudBaseMinM: toMetres(entry.cloudBaseMinM),
				cloudBaseMaxM: toMetres(entry.cloudBaseMaxM),
				thermalUpdraftsM: entry.thermalUpdraftsM,
				stableLayerM: toMetres(entry.stableLayerM),
				winds: entry.winds,
			};

			return prisma.elmeteoForecast.upsert({
				where: {
					site_day_hour: { site: site.slug, day, hour: entry.hour },
				},
				create: { site: site.slug, day, hour: entry.hour, ...data },
				update: data,
			});
		}),
	);

	return table.hours.length;
}

/** Latest stored forecast for one site and day, ordered by hour. */
export function getForecast(site: string, day: string) {
	return prisma.elmeteoForecast.findMany({
		where: { site, day },
		orderBy: { hour: "asc" },
	});
}

/**
 * Deletes forecasts for days that have passed.
 *
 * `day` is a YYYY-MM-DD string, which sorts lexicographically, so a string
 * comparison is a correct date comparison here.
 */
export async function cleanupForecasts(before: string) {
	const { count } = await prisma.elmeteoForecast.deleteMany({
		where: { day: { lt: before } },
	});
	return count;
}
