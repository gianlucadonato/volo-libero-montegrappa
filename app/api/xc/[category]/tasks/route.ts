import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import z from "zod";
import { getXcTasksByCategory } from "@/actions/xc/getXcTasks";
import { logger } from "@/lib/logger";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import { XcTaskSchema } from "@/schemas";

const ParamsSchema = z.object({
	category: z.nativeEnum(XcCategoryLevel),
});

/**
 * Get XC tasks by category
 * @description Fetch XC tasks for a specific category
 * @pathParams ParamsSchema
 * @response XcTaskSchema[]
 * @openapi
 */

export const GET = async (
	request: NextRequest,
	{ params }: { params: Promise<{ category: string }> },
) => {
	const log = logger.child({
		requestId: request.headers.get("x-request-id") || randomUUID(),
		method: "GET",
		path: "/xc/[category]/tasks",
	});
	const { category } = await params;
	const { success, data: parsedParams } = ParamsSchema.safeParse({
		category: category?.toUpperCase(),
	});
	if (!success) {
		log.warn({ category }, "Invalid category parameter");
		return Response.json({ message: "Category not valid" }, { status: 400 });
	}
	try {
		const tasks = await getXcTasksByCategory(parsedParams.category);
		const parsedTasks = XcTaskSchema.array().parse(tasks);
		return Response.json(parsedTasks);
	} catch (error) {
		log.error(
			{ category: parsedParams.category, error },
			(error as Error).message || "Error fetching tasks for category",
		);
		return Response.json(
			{ message: (error as Error).message },
			{ status: 500 },
		);
	}
};
