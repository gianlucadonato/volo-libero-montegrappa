import Boom from "@hapi/boom";
import { headers } from "next/headers";
import getXcSubmissionByTask from "@/actions/xc/getXcSubmissionByTask";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { IdParamsSchema, XcSubmissionSchema } from "@/schemas/api";

/**
 * /xc/tasks/[id]/submission
 * @description Get the current user's latest submission for a task
 * @pathParams IdParamsSchema
 * @response XcSubmissionSchema
 * @auth
 * @openapi
 */
export async function GET(
	_request: Request,
	context: { params: Promise<{ id: string }> },
) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session) {
		return APIErrorResponse(Boom.unauthorized());
	}

	const { id } = await context.params;
	const { success } = IdParamsSchema.safeParse({ id });
	if (!success) {
		return APIErrorResponse(Boom.badRequest("Task ID not valid"));
	}

	try {
		const submission = await getXcSubmissionByTask(session.user.id, id);
		if (!submission) {
			return Response.json(null);
		}
		const parsed = XcSubmissionSchema.parse(formatSubmission(submission));
		return Response.json(parsed);
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/tasks/[id]/submission",
			id,
		});
	}
}

function formatSubmission(
	submission: Awaited<ReturnType<typeof getXcSubmissionByTask>>,
) {
	if (!submission) return null;
	return {
		...submission,
		createdAt: submission.createdAt.toISOString(),
		updatedAt: submission.updatedAt.toISOString(),
	};
}
