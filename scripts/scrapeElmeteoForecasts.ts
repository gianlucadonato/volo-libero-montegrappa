/**
 * Runs the ElMeteo forecast scrape from the command line.
 *
 * Useful to verify credentials and the parser against the live site without
 * waiting for the schedule:
 *
 *   pnpm tsx scripts/scrapeElmeteoForecasts.ts          # report only
 *   pnpm tsx scripts/scrapeElmeteoForecasts.ts --save   # also write to the database
 */

import { scrapeForecasts } from "@/lib/elmeteo-scraper";
import { saveForecast } from "@/store/elmeteo-forecasts";

const shouldSave = process.argv.includes("--save");

const { forecasts, failures } = await scrapeForecasts();

for (const forecast of forecasts) {
	const { site, day, table } = forecast;
	const [first] = table.hours;
	console.log(
		`${site.slug.padEnd(10)} ${day}  ${String(table.hours.length).padStart(2)} hours  ` +
			`${first.temperatureC ?? "?"}°C  winds: ${first.winds.map((wind) => wind.label).join(", ")}`,
	);

	if (shouldSave) {
		await saveForecast(forecast);
	}
}

if (failures.length > 0) {
	console.log(`\n${failures.length} failed:`);
	for (const failure of failures) {
		console.log(`  ${failure.slug} ${failure.day}: ${failure.error}`);
	}
}

console.log(
	`\n${forecasts.length} tables scraped${shouldSave ? " and saved" : ""}.`,
);
