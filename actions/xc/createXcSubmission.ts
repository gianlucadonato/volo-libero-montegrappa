"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recomputeXcAchievementsForUser } from "@/lib/xc";
import { XcSubmissionStatus } from "@/prisma/generated/enums";
import { inferTrackTypeFromFileName } from "@/schemas/xc";

type Input = {
	taskId: string;
	editionId: string;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	storageObjectKey: string;
	storageBucket?: string;
	checksum?: string;
	notes?: string;
};

export default async function createXcSubmission(input: Input) {
	const user = await getSessionUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	const task = await prisma.xcTask.findUnique({
		where: { id: input.taskId },
		include: {
			category: true,
		},
	});

	if (!task) {
		throw new Error("Task not found");
	}
	if (task.category.editionId !== input.editionId) {
		throw new Error("Task does not belong to selected edition");
	}

	const enrollment = await prisma.xcEnrollment.upsert({
		where: {
			userId_editionId: {
				userId: user.id,
				editionId: input.editionId,
			},
		},
		update: {},
		create: {
			userId: user.id,
			editionId: input.editionId,
		},
	});

	const submission = await prisma.xcTrackSubmission.create({
		data: {
			userId: user.id,
			editionId: input.editionId,
			taskId: input.taskId,
			enrollmentId: enrollment.id,
			fileType: inferTrackTypeFromFileName(input.fileName),
			status: XcSubmissionStatus.PENDING,
			fileName: input.fileName,
			mimeType: input.mimeType,
			sizeBytes: input.sizeBytes,
			storageBucket: input.storageBucket,
			storageObjectKey: input.storageObjectKey,
			checksum: input.checksum,
			notes: input.notes,
		},
	});

	await recomputeXcAchievementsForUser({
		userId: user.id,
		editionId: input.editionId,
	});

	return submission;
}
