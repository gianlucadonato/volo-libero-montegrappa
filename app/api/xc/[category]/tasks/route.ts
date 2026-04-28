import Boom from "@hapi/boom";
import z from "zod";
import { getXcTasksByCategory } from "@/actions/xc/getXcTasks";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import { XcTaskSchema } from "@/schemas";

const ParamsSchema = z.object({
	category: z.nativeEnum(XcCategoryLevel),
});

/**
 * /xc/[category]/tasks
 * @description Fetch XC tasks for a specific category
 * @pathParams ParamsSchema
 * @response XcTaskSchema[]
 * @openapi
 */

export const GET = async (
	_request: Request,
	context: { params: Promise<{ category: string }> },
) => {
	const { category } = await context.params;
	const { success, data: parsedParams } = ParamsSchema.safeParse({
		category: category?.toUpperCase(),
	});
	if (!success) {
		return APIErrorResponse(Boom.badRequest("Category not valid"));
	}
	try {
		const tasks = await getXcTasksByCategory(parsedParams.category);
		const parsedTasks = XcTaskSchema.array().parse(tasks);
		return Response.json(parsedTasks);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/[category]/tasks",
			category,
		});
	}
};
