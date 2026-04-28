import Boom from "@hapi/boom";
import { headers } from "next/headers";
import getXcTaskById from "@/actions/xc/getXcTaskById";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { IdParamsSchema, XcTaskSchema } from "@/schemas";

/**
 * /xc/tasks/[id]
 * @description Fetch XC Task details (includes the current user's submissions when authenticated)
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
		const session = await auth.api.getSession({ headers: await headers() });
		const task = await getXcTaskById(parsedParams.id, session?.user.id);
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

function formatTask(
	task: NonNullable<Awaited<ReturnType<typeof getXcTaskById>>>,
) {
	const submissions = (
		task as typeof task & {
			submissions?: Array<{
				reviewedAt: Date | null;
				createdAt: Date;
				updatedAt: Date;
				[key: string]: unknown;
			}>;
		}
	).submissions;
	return {
		...task,
		createdAt: task.createdAt.toISOString(),
		updatedAt: task.updatedAt.toISOString(),
		submissions: submissions?.map((s) => ({
			...s,
			reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
			createdAt: s.createdAt.toISOString(),
			updatedAt: s.updatedAt.toISOString(),
		})),
	};
}
