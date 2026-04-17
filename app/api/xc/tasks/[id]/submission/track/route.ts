import Boom from "@hapi/boom";
import { headers } from "next/headers";
import getXcSubmissionByTask from "@/actions/xc/getXcSubmissionByTask";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { parseIGC } from "@/lib/igc-parser";
import { downloadObject } from "@/lib/r2";

/**
 * /xc/tasks/[id]/submission/track
 * @description Get parsed IGC track data for the user's submission
 * @pathParams IdParamsSchema
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

	const { id: taskId } = await context.params;

	try {
		const submission = await getXcSubmissionByTask(session.user.id, taskId);
		if (!submission) {
			return APIErrorResponse(Boom.notFound("No submission found"));
		}

		const igcContent = await downloadObject(submission.fileName);
		const parsed = parseIGC(igcContent);

		return Response.json({
			submissionId: submission.id,
			status: submission.status,
			header: parsed.header,
			stats: parsed.stats,
			fixes: parsed.fixes,
		});
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "GET /xc/tasks/[id]/submission/track",
			taskId,
		});
	}
}
