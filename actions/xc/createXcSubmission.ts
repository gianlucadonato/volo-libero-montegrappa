"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { XcSubmissionStatus } from "@/prisma/generated/enums";

type Input = {
	taskId: string;
	editionId: string;
	fileName: string;
	notes?: string;
};

export default async function createXcSubmission(input: Input) {
	const user = await getSessionUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	const task = await prisma.xcTask.findUnique({
		where: {
			id: input.taskId,
			editionTasks: { some: { editionId: input.editionId } },
		},
	});

	if (!task) {
		throw new Error("Task not found");
	}

	// Check enrollment at edition level
	const enrollment = await prisma.xcEnrollment.findUnique({
		where: {
			userId_editionId: {
				userId: user.id,
				editionId: input.editionId,
			},
		},
	});

	if (!enrollment) {
		throw new Error("Devi iscriverti al brevetto XC prima di caricare tracce");
	}

	const submission = await prisma.xcTrackSubmission.create({
		data: {
			userId: user.id,
			editionId: input.editionId,
			taskId: input.taskId,
			status: XcSubmissionStatus.PENDING,
			fileName: input.fileName,
			notes: input.notes,
		},
	});

	// TODO: recomputeXcAchievementsForUser

	return submission;
}
