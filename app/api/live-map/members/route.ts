import APIErrorResponse from "@/helpers/APIErrorResponse";
import { memberAircraftId, memberDisplayCallsign } from "@/lib/live-map";
import { getMemberTracks } from "@/lib/live-map-server";
import { LiveMemberTracksResponseSchema } from "@/schemas";

/**
 * /live-map/members
 * @description Tracks recorded in the last 8 hours for every club member with an OGN device, including those out of signal (data from EasyXCScore)
 * @response LiveMemberTracksResponseSchema
 * @openapi
 */
export const GET = async () => {
	try {
		const tracks = await getMemberTracks();
		const members = tracks.map(({ member, key, points }) => ({
			id: memberAircraftId(member),
			historyKey: key,
			name: member.name,
			label: memberDisplayCallsign(member),
			points,
		}));
		return Response.json(LiveMemberTracksResponseSchema.parse({ members }), {
			headers: { "Cache-Control": "no-store" },
		});
	} catch (error) {
		return APIErrorResponse(error, { endpoint: "GET /live-map/members" });
	}
};
