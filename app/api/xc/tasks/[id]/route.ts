import Boom from "@hapi/boom";
import z from "zod";
import getXcTaskById from "@/actions/xc/getXcTaskById";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { XcTaskSchema } from "@/schemas";

const ParamsSchema = z.object({
	id: z.string(),
});

/**
 * /xc/tasks/[id]
 * @description Fetch XC Task details
 * @pathParams ParamsSchema
 * @response XcTaskSchema
 * @openapi
 */

export const GET = async (
	_request: Request,
	context: { params: Promise<{ id: string }> },
) => {
	const { id } = await context.params;
	const { success, data: parsedParams } = ParamsSchema.safeParse({
		id,
	});
	if (!success) {
		return APIErrorResponse(Boom.badRequest("Task ID not valid"));
	}
	try {
		const task = await getXcTaskById(parsedParams.id);
		const parsedTask = XcTaskSchema.parse(task);
		return Response.json(parsedTask);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/tasks/[id]",
			id,
		});
	}
};
