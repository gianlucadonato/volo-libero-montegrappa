/**
 * Catalogue of the elmeteo.it take-off forecast pages the scraper reads.
 *
 * Each page is a server-rendered PHP table of hourly forecasts for one site.
 * The day shown is selected with a `?day=YYYY-MM-DD` query parameter (a plain
 * GET link in the page's tab bar, not a client-side tab), and three days are
 * published: today, tomorrow and the day after.
 *
 * `requiresAuth` records what the source does when logged out: those pages
 * redirect to /non-hai-fatto-login/ and never render a table, so a run without
 * credentials can only collect the public ones.
 */

export type ElmeteoSite = {
	/** Stable identifier, used as the database key. Never change these. */
	slug: string;
	/** Human label, matching how the club refers to the take-off. */
	name: string;
	/** Page basename on elmeteo.it, without the .php extension. */
	page: string;
	/** Whether the page 302s to the login wall when unauthenticated. */
	requiresAuth: boolean;
};

export const elmeteoSites = [
	{
		slug: "tappeti",
		name: "Tappeti",
		page: "tappeti",
		requiresAuth: true,
	},
	{
		slug: "campeggia",
		name: "Campeggia",
		page: "campeggia",
		requiresAuth: true,
	},
	{
		slug: "panettone",
		name: "Panettone",
		page: "panettone",
		requiresAuth: false,
	},
	{
		slug: "vedetta",
		name: "Vedetta",
		page: "vedetta",
		requiresAuth: true,
	},
	{
		slug: "tomba",
		name: "Monte Tomba",
		page: "tomba",
		requiresAuth: true,
	},
	{
		slug: "borso",
		name: "Landing Garden Relais",
		page: "borso",
		requiresAuth: false,
	},
] as const satisfies readonly ElmeteoSite[];

export type ElmeteoSiteSlug = (typeof elmeteoSites)[number]["slug"];

export const elmeteoBaseUrl = "https://www.elmeteo.it";

/** How many days of forecast each page publishes, including today. */
export const elmeteoForecastDays = 3;

export function getElmeteoSite(slug: string) {
	return elmeteoSites.find((site) => site.slug === slug);
}

/**
 * Builds the URL of one (site, day) table.
 *
 * Only URLs built here are ever requested: elmeteo.it runs a "Blackhole for Bad
 * Bots" trap that plants a hidden link on every page and permanently bans the IP
 * of anything that follows it. The scraper must therefore never crawl links out
 * of the fetched HTML — see the warning in lib/elmeteo-scraper.ts.
 */
export function buildForecastUrl(site: ElmeteoSite, day: string) {
	return `${elmeteoBaseUrl}/${site.page}.php?day=${day}`;
}

/**
 * The days a run collects: today plus the next two, as YYYY-MM-DD in the site's
 * own timezone (Europe/Rome), which is what the `day` parameter expects.
 */
export function getForecastDays(now = new Date()) {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Rome",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	const millisecondsPerDay = 24 * 60 * 60 * 1000;

	return Array.from({ length: elmeteoForecastDays }, (_, offset) =>
		formatter.format(new Date(now.getTime() + offset * millisecondsPerDay)),
	);
}
