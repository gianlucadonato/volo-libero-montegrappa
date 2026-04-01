"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recomputeXcAchievementsForUser } from "@/lib/xc";
import { XcSubmissionStatus } from "@/prisma/generated/enums";

type Input = {
	submissionId: string;
	status: "APPROVED" | "REJECTED";
	notes?: string;
	pointsAwarded?: number;
};

export default async function reviewXcSubmission(input: Input) {
	const user = await getSessionUser();
	if (!user || user.role !== "ADMIN") {
		throw new Error("Unauthorized");
	}

	const submission = await prisma.xcTrackSubmission.update({
		where: { id: input.submissionId },
		data: {
			status: input.status,
			notes: input.notes,
			pointsAwarded:
				input.status === XcSubmissionStatus.APPROVED
					? input.pointsAwarded
					: null,
			reviewedAt: new Date(),
			reviewedBy: user.id,
		},
	});

	await recomputeXcAchievementsForUser({
		userId: submission.userId,
		editionId: submission.editionId,
	});

	return submission;
}
