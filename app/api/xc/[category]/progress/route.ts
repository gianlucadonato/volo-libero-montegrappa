import Boom from "@hapi/boom";
import { headers } from "next/headers";
import z from "zod";
import { getXcProgressByCategory } from "@/actions/xc/getXcProgress";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import { XcProgressSchema } from "@/schemas";

const ParamsSchema = z.object({
	category: z.nativeEnum(XcCategoryLevel),
});

/**
 * /xc/[category]/progress
 * @description Fetch XC progress for a specific category
 * @pathParams ParamsSchema
 * @response XcProgressSchema
 * @auth
 * @openapi
 */

export const GET = async ({
	params,
}: {
	params: Promise<{ category: string }>;
}) => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		return APIErrorResponse(Boom.unauthorized());
	}

	const { category } = await params;
	const { success, data: parsedParams } = ParamsSchema.safeParse({
		category: category?.toUpperCase(),
	});
	if (!success) {
		return APIErrorResponse(Boom.badRequest("Category not valid"));
	}
	try {
		const progress = await getXcProgressByCategory(
			session.user.id,
			parsedParams.category,
		);
		const parsedProgress = progress ? XcProgressSchema.parse(progress) : null;
		return Response.json(parsedProgress);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/[category]/progress",
			category,
		});
	}
};
