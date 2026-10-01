import Boom from "@hapi/boom";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { getAircraftTrack } from "@/lib/live-map-server";
import { LiveTrackQuerySchema, LiveTrackResponseSchema } from "@/schemas";

/**
 * /live-map/track
 * @description Track recorded in the last 8 hours for one OGN callsign (data from EasyXCScore)
 * @queryParams LiveTrackQuerySchema
 * @response LiveTrackResponseSchema
 * @openapi
 */
export const GET = async (request: Request) => {
	const { searchParams } = new URL(request.url);
	const parsed = LiveTrackQuerySchema.safeParse({
		key: searchParams.get("key") ?? undefined,
	});
	if (!parsed.success) {
		return APIErrorResponse(Boom.badRequest("Callsign not valid"));
	}
	try {
		const points = await getAircraftTrack(parsed.data.key);
		return Response.json(LiveTrackResponseSchema.parse({ points }), {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (error) {
		return APIErrorResponse(error, { endpoint: "GET /live-map/track" });
	}
};
