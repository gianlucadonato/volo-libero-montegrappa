import { env } from "@/env";
import {
	type ElmeteoForecastTable,
	parseForecastTable,
} from "@/lib/elmeteo-forecast";
import {
	buildForecastUrl,
	type ElmeteoSite,
	elmeteoBaseUrl,
	elmeteoSites,
	getForecastDays,
} from "@/lib/elmeteo-sites";
import { logger } from "@/lib/logger";

/**
 * Fetching side of the ElMeteo forecast scraper.
 *
 * ## Never follow links from the fetched HTML
 *
 * elmeteo.it runs "Blackhole for Bad Bots": robots.txt disallows /*blackhole
 * and every page carries a hidden `?blackhole=<hash>` link that no human can
 * click. Anything that requests it gets its IP permanently banned — which would
 * take down the club's whole forecast feature, not just this job.
 *
 * Only URLs built by `buildForecastUrl` and the login endpoint are ever
 * requested. Do not add link discovery or a crawler here.
 *
 * ## One login per run
 *
 * Four of the six pages 302 to /non-hai-fatto-login/ when logged out. The
 * WordPress session cookie is obtained once and reused for every fetch of the
 * run, so a full run is one login rather than a dozen.
 */

const userAgent =
	"VoloLiberoMontegrappaBot/1.0 (+https://www.volliberomontegrappa.it; club.montegrappa@gmail.com)";

/** Politeness delay between requests to the source. */
const requestDelayMs = 2000;

const loginUrl = `${elmeteoBaseUrl}/wp-login.php`;
const loginWallPath = "/non-hai-fatto-login";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Minimal cookie jar. The site sets a handful of `wordpress_logged_in_*`
 * cookies on login and expects them back on every request; nothing here needs
 * path or domain scoping, since only one host is ever contacted.
 */
class CookieJar {
	private readonly cookies = new Map<string, string>();

	store(response: Response) {
		for (const header of response.headers.getSetCookie()) {
			const [pair] = header.split(";");
			const separator = pair.indexOf("=");
			if (separator > 0) {
				this.cookies.set(
					pair.slice(0, separator).trim(),
					pair.slice(separator + 1).trim(),
				);
			}
		}
	}

	get header() {
		return Array.from(this.cookies, ([name, value]) => `${name}=${value}`).join(
			"; ",
		);
	}

	get isEmpty() {
		return this.cookies.size === 0;
	}
}

export class ElmeteoAuthError extends Error {}

/**
 * Logs into WordPress and returns the jar holding the session cookies.
 *
 * `redirect: "manual"` is essential: a successful login answers 302, and
 * following it would drop the Set-Cookie headers we are here for.
 */
async function login(): Promise<CookieJar> {
	if (!env.ELMETEO_USERNAME || !env.ELMETEO_PASSWORD) {
		throw new ElmeteoAuthError(
			"ElMeteo credentials are not configured: set ELMETEO_USERNAME and ELMETEO_PASSWORD",
		);
	}

	const jar = new CookieJar();

	// WordPress refuses the login unless it sees its own test cookie come back.
	const form = new URLSearchParams({
		log: env.ELMETEO_USERNAME,
		pwd: env.ELMETEO_PASSWORD,
		rememberme: "forever",
		"wp-submit": "Accedi",
		testcookie: "1",
	});

	const response = await fetch(loginUrl, {
		method: "POST",
		body: form,
		redirect: "manual",
		headers: {
			"user-agent": userAgent,
			"content-type": "application/x-www-form-urlencoded",
			cookie: "wordpress_test_cookie=WP+Cookie+check",
		},
	});

	jar.store(response);

	// WordPress signals a bad password by re-rendering the form with 200 rather
	// than redirecting, so a missing session cookie is the reliable check.
	if (jar.isEmpty || !jar.header.includes("wordpress_logged_in")) {
		throw new ElmeteoAuthError(
			`ElMeteo login failed (HTTP ${response.status}): check ELMETEO_USERNAME and ELMETEO_PASSWORD`,
		);
	}

	return jar;
}

/**
 * Fetches one forecast page. Returns the HTML, or throws when the source
 * bounced us to the login wall.
 */
async function fetchForecastHtml(url: string, jar: CookieJar | undefined) {
	const response = await fetch(url, {
		redirect: "manual",
		headers: {
			"user-agent": userAgent,
			...(jar && !jar.isEmpty ? { cookie: jar.header } : {}),
		},
	});

	const location = response.headers.get("location") ?? "";
	if (response.status >= 300 && response.status < 400) {
		if (location.includes(loginWallPath)) {
			throw new ElmeteoAuthError(`Not authenticated for ${url}`);
		}
		throw new Error(`Unexpected redirect to ${location} for ${url}`);
	}

	if (!response.ok) {
		throw new Error(`HTTP ${response.status} for ${url}`);
	}

	return response.text();
}

export type ScrapedForecast = {
	site: ElmeteoSite;
	day: string;
	table: ElmeteoForecastTable;
};

export type ScrapeFailure = {
	slug: string;
	day: string;
	error: string;
};

export type ScrapeResult = {
	forecasts: ScrapedForecast[];
	failures: ScrapeFailure[];
};

/**
 * Scrapes every (site, day) pair of a run.
 *
 * A single page failing must not discard the rest: each target is caught
 * individually and reported in `failures`, so one flaky page costs one table
 * instead of the whole run.
 */
export async function scrapeForecasts(now = new Date()): Promise<ScrapeResult> {
	const days = getForecastDays(now);
	const forecasts: ScrapedForecast[] = [];
	const failures: ScrapeFailure[] = [];

	let jar: CookieJar | undefined;
	const needsAuth = elmeteoSites.some((site) => site.requiresAuth);

	if (needsAuth) {
		try {
			jar = await login();
			logger.info("ElMeteo login succeeded");
		} catch (error) {
			// The public pages are still worth collecting, so this is not fatal.
			// The message is logged explicitly: pino serialises a bare Error to {}.
			logger.error(
				{ reason: error instanceof Error ? error.message : String(error) },
				"ElMeteo login failed, continuing with public pages only",
			);
		}
	}

	let first = true;

	for (const site of elmeteoSites) {
		if (site.requiresAuth && !jar) {
			for (const day of days) {
				failures.push({
					slug: site.slug,
					day,
					error: "Skipped: no authenticated session",
				});
			}
			continue;
		}

		for (const day of days) {
			// Space the requests out: 18 fetches per run is nothing for the source,
			// but hammering it in a burst would be rude and more likely to be
			// throttled.
			if (!first) await sleep(requestDelayMs);
			first = false;

			const url = buildForecastUrl(site, day);

			try {
				const html = await fetchForecastHtml(url, jar);
				forecasts.push({ site, day, table: parseForecastTable(html) });
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				failures.push({ slug: site.slug, day, error: message });
				logger.warn({ url, error: message }, "ElMeteo forecast fetch failed");
			}
		}
	}

	return { forecasts, failures };
}
