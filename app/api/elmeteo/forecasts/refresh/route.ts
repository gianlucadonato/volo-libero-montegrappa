import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { env } from "@/env";
import {
	type RefreshTrigger,
	refreshForecasts,
} from "@/lib/elmeteo-forecast-refresh";
import { logger } from "@/lib/logger";

/**
 * The only trigger for the ElMeteo forecast scrape.
 *
 * The source recomputes its take-off tables twice a day and publishes them at
 * 10:15 and 22:15 Rome time, so a scheduled ping a minute later collects each
 * publish once. See `docs/elmeteo-scraper.md` for the cron to configure.
 *
 * The same endpoint serves a human running a backfill or checking a deploy;
 * `?trigger=schedule` is what tells the two apart in the logs, and nothing else
 * depends on it. Both share the run lock in `refreshForecasts`.
 *
 * The work runs in `after()` and the route answers 202 immediately: a run takes
 * roughly 40 seconds (18 fetches spaced 2s apart), which is long enough for a
 * proxy to time the request out and retry it, doubling the load on the source.
 */

function isValidToken(token: string) {
	if (!env.ELMETEO_SCRAPE_TOKEN) return false;
	const expected = Buffer.from(env.ELMETEO_SCRAPE_TOKEN);
	const received = Buffer.from(token);
	if (expected.length !== received.length) {
		return false;
	}
	return timingSafeEqual(expected, received);
}

/**
 * @openapi
 * @auth bearer
 * @response { "message": "string" }
 */
export const POST = async (req: Request) => {
	if (!env.ELMETEO_SCRAPE_TOKEN) {
		logger.error("ElMeteo scrape trigger is not configured");
		return Response.json({ error: "Not configured" }, { status: 503 });
	}

	const authorization = (await headers()).get("authorization");
	const token = authorization?.split(" ")[1];
	if (!token || !isValidToken(token)) {
		return Response.json({ error: "Not authenticated" }, { status: 401 });
	}

	// Anything but the scheduler's own value is a person at a terminal.
	const trigger: RefreshTrigger =
		new URL(req.url).searchParams.get("trigger") === "schedule"
			? "schedule"
			: "manual";

	after(async () => {
		try {
			await refreshForecasts(trigger);
		} catch (error) {
			logger.error(
				{ reason: error instanceof Error ? error.message : String(error) },
				"ElMeteo forecast scrape failed",
			);
		}
	});

	return Response.json({ message: "Scrape started" }, { status: 202 });
};
