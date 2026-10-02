import APIErrorResponse from "@/helpers/APIErrorResponse";
import { getActiveSos } from "@/lib/live-map-server";
import { LiveSosResponseSchema } from "@/schemas";

/**
 * /live-map/sos
 * @description Open free-flight SOS alerts raised from the EXTK tracker app (data from EasyXCScore)
 * @response LiveSosResponseSchema
 * @openapi
 */
export const GET = async () => {
	try {
		const sos = await getActiveSos();
		return Response.json(LiveSosResponseSchema.parse({ sos }), {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (error) {
		return APIErrorResponse(error, { endpoint: "GET /live-map/sos" });
	}
};
