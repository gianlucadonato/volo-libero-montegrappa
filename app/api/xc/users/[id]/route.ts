import Boom from "@hapi/boom";
import z from "zod";
import { getXcPilotProfile } from "@/actions/xc/getXcPilotProfile";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { XcPilotProfileSchema } from "@/schemas";

const QuerySchema = z.object({
	edition: z.coerce.number().int().optional(),
});

/**
 * /xc/users/[id]
 * @description Public XC profile of a pilot: per-category progress for one edition and the approved flights of that edition
 * @pathParams IdParamsSchema
 * @queryParams QuerySchema
 * @response XcPilotProfileSchema
 * @openapi
 */
export const GET = async (
	request: Request,
	context: { params: Promise<{ id: string }> },
) => {
	const { id } = await context.params;

	const { searchParams } = new URL(request.url);
	const parsedQuery = QuerySchema.safeParse({
		edition: searchParams.get("edition") ?? undefined,
	});
	if (!parsedQuery.success) {
		return APIErrorResponse(Boom.badRequest("Edition not valid"));
	}

	try {
		const profile = await getXcPilotProfile(id, parsedQuery.data.edition);
		if (!profile) {
			return APIErrorResponse(Boom.notFound("Pilot not found"));
		}
		return Response.json(XcPilotProfileSchema.parse(profile));
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/users/[id]",
			id,
		});
	}
};
