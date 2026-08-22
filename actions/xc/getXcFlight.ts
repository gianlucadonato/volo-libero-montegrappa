"use server";

import { prisma } from "@/lib/prisma";
import { PILOT_FLIGHT_TASK_SELECT, toPilotFlight } from "@/lib/xc-flight";
import { XcPilotFlightSchema } from "@/schemas";

/**
 * Public detail of a single flight, used by `/xc/flights/[id]`.
 *
 * Only approved submissions of non-deleted pilots are exposed — pending and
 * rejected tracks stay private to their owner, exactly like
 * `GET /api/xc/submissions/[id]`.
 */
export async function getXcFlight(submissionId: string) {
	const submission = await prisma.xcTrackSubmission.findFirst({
		where: {
			id: submissionId,
			status: "APPROVED",
			user: { deletedAt: null },
		},
		include: {
			user: {
				select: { id: true, firstName: true, lastName: true, image: true },
			},
			edition: { select: { id: true, title: true } },
			task: { select: PILOT_FLIGHT_TASK_SELECT },
		},
	});

	if (!submission) return null;

	return {
		pilot: submission.user,
		edition: submission.edition,
		flight: XcPilotFlightSchema.parse(toPilotFlight(submission)),
	};
}
