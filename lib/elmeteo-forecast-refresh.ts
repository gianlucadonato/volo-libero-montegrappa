import { scrapeForecasts } from "@/lib/elmeteo-scraper";
import { getForecastDays } from "@/lib/elmeteo-sites";
import { logger } from "@/lib/logger";
import { cleanupForecasts, saveForecast } from "@/store/elmeteo-forecasts";

/**
 * Scrapes the take-off forecast tables and stores them.
 *
 * Shared by the two things that can start a run: the uploader's report (the
 * normal trigger) and the token-gated HTTP endpoint (manual runs and
 * backfills). Both go through the same lock, so a manual run during an upload
 * cannot double the load on the source.
 *
 * The lock is per-process, which is all that is needed here: the app runs as a
 * single container, and the worst case if that ever changes is one duplicated
 * run, which upserts to the same rows.
 */

let isRunning = false;

export type RefreshResult =
	| { status: "skipped" }
	| {
			status: "completed";
			tables: number;
			savedHours: number;
			failures: number;
			/**
			 * The source's own publish time, as printed on the pages. Logged on every
			 * run so a trigger that keeps arriving before the source republishes
			 * shows up as a `sourceUpdatedAt` that never advances.
			 */
			sourceUpdatedAt?: string;
	  };

export async function refreshForecasts(
	trigger: "report" | "manual",
): Promise<RefreshResult> {
	if (isRunning) {
		logger.warn(
			{ trigger },
			"ElMeteo forecast scrape already running, skipped",
		);
		return { status: "skipped" };
	}

	isRunning = true;
	const startedAt = Date.now();

	try {
		const { forecasts, failures } = await scrapeForecasts();

		let savedHours = 0;
		for (const forecast of forecasts) {
			try {
				savedHours += await saveForecast(forecast);
			} catch (error) {
				// A write failing must not cost the forecasts already collected.
				// The message is read explicitly: pino serialises a bare Error to {}.
				logger.error(
					{
						reason: error instanceof Error ? error.message : String(error),
						site: forecast.site.slug,
						day: forecast.day,
					},
					"ElMeteo forecast save failed",
				);
			}
		}

		// Yesterday and earlier are of no use to anyone planning a flight.
		try {
			const [today] = getForecastDays();
			const deleted = await cleanupForecasts(today);
			if (deleted > 0) {
				logger.info({ deleted }, "ElMeteo forecast cleanup completed");
			}
		} catch (error) {
			logger.error(
				{ reason: error instanceof Error ? error.message : String(error) },
				"ElMeteo forecast cleanup failed",
			);
		}

		const publishedAt = forecasts
			.map((forecast) => forecast.table.updatedAt)
			.filter((date): date is Date => date !== undefined)
			.sort((a, b) => b.getTime() - a.getTime())[0];

		const result: RefreshResult = {
			status: "completed",
			tables: forecasts.length,
			savedHours,
			failures: failures.length,
			sourceUpdatedAt: publishedAt?.toISOString(),
		};

		logger.info(
			{
				trigger,
				...result,
				failed: failures,
				durationMs: Date.now() - startedAt,
			},
			"ElMeteo forecast scrape completed",
		);

		return result;
	} finally {
		isRunning = false;
	}
}
