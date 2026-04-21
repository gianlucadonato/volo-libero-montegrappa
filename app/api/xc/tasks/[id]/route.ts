import Boom from "@hapi/boom";
import getXcTaskById from "@/actions/xc/getXcTaskById";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { IdParamsSchema, XcTaskSchema } from "@/schemas";

/**
 * /xc/tasks/[id]
 * @description Fetch XC Task details
 * @pathParams IdParamsSchema
 * @response XcTaskSchema
 * @openapi
 */

export const GET = async (
	_request: Request,
	context: { params: Promise<{ id: string }> },
) => {
	const { id } = await context.params;
	const { success, data: parsedParams } = IdParamsSchema.safeParse({
		id,
	});
	if (!success) {
		return APIErrorResponse(Boom.badRequest("Task ID not valid"));
	}
	try {
		const task = await getXcTaskById(parsedParams.id);
		if (!task) {
			return APIErrorResponse(Boom.notFound("Task not found"));
		}
		const parsedTask = XcTaskSchema.parse(formatTask(task));
		return Response.json(parsedTask);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/tasks/[id]",
			id,
		});
	}
};

function formatTask(task: Awaited<ReturnType<typeof getXcTaskById>>) {
	if (!task) return null;
	return {
		...task,
		createdAt: task.createdAt.toISOString(),
		updatedAt: task.updatedAt.toISOString(),
	};
}
