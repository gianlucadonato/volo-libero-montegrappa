import Boom from "@hapi/boom";
import z from "zod";
import { getXcLeaderboardByCategory } from "@/actions/xc/getXcLeaderboard";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import { XcLeaderboardEntrySchema } from "@/schemas";

const ParamsSchema = z.object({
	category: z.nativeEnum(XcCategoryLevel),
});

const QuerySchema = z.object({
	edition: z.coerce.number().int().optional(),
});

/**
 * /xc/[category]/leaderboard
 * @description Fetch the XC leaderboard for a specific category
 * @pathParams ParamsSchema
 * @queryParams QuerySchema
 * @response XcLeaderboardEntrySchema[]
 * @openapi
 */

export const GET = async (
	request: Request,
	context: { params: Promise<{ category: string }> },
) => {
	const { category } = await context.params;
	const { success, data: parsedParams } = ParamsSchema.safeParse({
		category: category?.toUpperCase(),
	});
	if (!success) {
		return APIErrorResponse(Boom.badRequest("Category not valid"));
	}
	const { searchParams } = new URL(request.url);
	const parsedQuery = QuerySchema.safeParse({
		edition: searchParams.get("edition") ?? undefined,
	});
	if (!parsedQuery.success) {
		return APIErrorResponse(Boom.badRequest("Edition not valid"));
	}
	try {
		const entries = await getXcLeaderboardByCategory(
			parsedParams.category,
			parsedQuery.data.edition,
		);
		const parsed = XcLeaderboardEntrySchema.array().parse(entries);
		return Response.json(parsed);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/[category]/leaderboard",
			category,
		});
	}
};
