import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import z from "zod";
import { getXcProgressByCategory } from "@/actions/xc/getXcProgress";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import { XcProgressSchema } from "@/schemas";

const ParamsSchema = z.object({
	category: z.nativeEnum(XcCategoryLevel),
});

/**
 * Get XC progress by category
 * @description Fetch XC progress for a specific category
 * @pathParams ParamsSchema
 * @response XcProgressSchema
 * @auth
 * @openapi
 */

export const GET = async (
	request: NextRequest,
	{ params }: { params: Promise<{ category: string }> },
) => {
	const log = logger.child({
		requestId: request.headers.get("x-request-id") || randomUUID(),
		method: "GET",
		path: "/xc/[category]/progress",
	});
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		return Response.json({ message: "Not authenticated" }, { status: 401 });
	}

	const { category } = await params;
	const { success, data: parsedParams } = ParamsSchema.safeParse({
		category: category?.toUpperCase(),
	});
	if (!success) {
		log.warn({ category }, "Invalid category parameter");
		return Response.json({ message: "Category not valid" }, { status: 400 });
	}
	try {
		const progress = await getXcProgressByCategory(
			session.user.id,
			parsedParams.category,
		);
		const parsedProgress = progress ? XcProgressSchema.parse(progress) : null;
		return Response.json(parsedProgress);
	} catch (error) {
		log.error(
			{ category: parsedParams.category, error },
			(error as Error).message || "Error fetching progress for category",
		);
		return Response.json(
			{ message: (error as Error).message },
			{ status: 500 },
		);
	}
};
