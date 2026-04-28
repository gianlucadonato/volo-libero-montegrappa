import { listXcEditions } from "@/actions/xc/listXcEditions";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { XcEditionSummarySchema } from "@/schemas";

/**
 * /xc/editions
 * @description List all XC editions (id, title, active flag) ordered by year desc
 * @response XcEditionSummarySchema[]
 * @openapi
 */

export const GET = async () => {
	try {
		const editions = await listXcEditions();
		const parsed = XcEditionSummarySchema.array().parse(editions);
		return Response.json(parsed);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/editions",
		});
	}
};
