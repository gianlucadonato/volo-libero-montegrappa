import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { env } from "@/env";
import { refreshForecasts } from "@/lib/elmeteo-forecast-refresh";
import { logger } from "@/lib/logger";

/**
 * Manual trigger for the ElMeteo forecast scrape.
 *
 * The normal trigger is the uploader's report (see `app/api/elmeteo/route.ts`):
 * that is the moment the source has finished recomputing, so there is nothing
 * to schedule. This endpoint stays for backfills and for verifying a deploy
 * without waiting for the next upload.
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
export const POST = async () => {
	if (!env.ELMETEO_SCRAPE_TOKEN) {
		logger.error("ElMeteo scrape trigger is not configured");
		return Response.json({ error: "Not configured" }, { status: 503 });
	}

	const authorization = (await headers()).get("authorization");
	const token = authorization?.split(" ")[1];
	if (!token || !isValidToken(token)) {
		return Response.json({ error: "Not authenticated" }, { status: 401 });
	}

	after(async () => {
		try {
			await refreshForecasts("manual");
		} catch (error) {
			logger.error(
				{ reason: error instanceof Error ? error.message : String(error) },
				"ElMeteo forecast scrape failed",
			);
		}
	});

	return Response.json({ message: "Scrape started" }, { status: 202 });
};
