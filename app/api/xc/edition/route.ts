import Boom from "@hapi/boom";
import z from "zod";
import { getXcEdition } from "@/actions/xc/getXcEdition";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import { XcEditionSchema } from "@/schemas";

const CategoryQuerySchema = z.object({
	category: z.nativeEnum(XcCategoryLevel).optional(),
});

/**
 * /xc/edition
 * @description Fetch the current XC edition with its tasks, optionally filtered by category
 * @queryParams CategoryQuerySchema
 * @response XcEditionSchema
 * @openapi
 */

export const GET = async (request: Request) => {
	const { searchParams } = new URL(request.url);
	const categoryParam = searchParams.get("category")?.toUpperCase();

	const { success, data: parsedQuery } = CategoryQuerySchema.safeParse({
		category: categoryParam || undefined,
	});
	if (!success) {
		return APIErrorResponse(Boom.badRequest("Invalid query parameters"));
	}

	try {
		const edition = await getXcEdition(parsedQuery.category);
		if (!edition) {
			return APIErrorResponse(Boom.notFound("No active edition found"));
		}
		const parsed = XcEditionSchema.parse(edition);
		return Response.json(parsed);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/edition",
			category: categoryParam,
		});
	}
};
