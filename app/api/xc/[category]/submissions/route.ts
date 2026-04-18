import Boom from "@hapi/boom";
import { headers } from "next/headers";
import z from "zod";
import getXcSubmissionsByCategory from "@/actions/xc/getXcSubmissionsByCategory";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import { XcSubmissionSchema } from "@/schemas";

const ParamsSchema = z.object({
	category: z.nativeEnum(XcCategoryLevel),
});

/**
 * /xc/[category]/submissions
 * @description Fetch all submissions for the current user in a specific category
 * @pathParams ParamsSchema
 * @response XcSubmissionSchema[]
 * @auth
 * @openapi
 */
export const GET = async (
	_request: Request,
	context: { params: Promise<{ category: string }> },
) => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		return APIErrorResponse(Boom.unauthorized());
	}

	const { category } = await context.params;
	const { success, data: parsedParams } = ParamsSchema.safeParse({
		category: category?.toUpperCase(),
	});
	if (!success) {
		return APIErrorResponse(Boom.badRequest("Category not valid"));
	}

	try {
		const submissions = await getXcSubmissionsByCategory(
			session.user.id,
			parsedParams.category,
		);
		const parsed = XcSubmissionSchema.array().parse(submissions);
		return Response.json(parsed);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/[category]/submissions",
			category,
		});
	}
};
