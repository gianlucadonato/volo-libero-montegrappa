import APIErrorResponse from "@/helpers/APIErrorResponse";
import { getLiveAircraft } from "@/lib/live-map-server";
import { LivePositionsResponseSchema } from "@/schemas";

/**
 * /live-map/positions
 * @description Live OGN positions over the Monte Grappa flying area, with club members flagged (data from EasyXCScore)
 * @response LivePositionsResponseSchema
 * @openapi
 */
export const GET = async () => {
	try {
		const aircraft = await getLiveAircraft();
		return Response.json(LivePositionsResponseSchema.parse({ aircraft }), {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (error) {
		return APIErrorResponse(error, { endpoint: "GET /live-map/positions" });
	}
};
