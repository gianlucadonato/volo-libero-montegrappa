import Boom from "@hapi/boom";
import { headers } from "next/headers";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/r2";

/**
 * /xc/submissions/[id]
 * @description Delete a submission: removes R2 file, deletes record, recalculates XcProgress
 * @pathParams IdParamsSchema
 * @auth
 * @openapi
 */
export async function DELETE(
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

	try {
		const submission = await prisma.xcTrackSubmission.findUnique({
			where: { id },
			include: { task: true },
		});

		if (!submission) {
			return APIErrorResponse(Boom.notFound("Submission not found"));
		}

		if (submission.userId !== session.user.id) {
			return APIErrorResponse(Boom.forbidden());
		}

		// Delete the R2 file
		try {
			await deleteObject(submission.fileName);
		} catch (err) {
			console.error("Failed to delete R2 object:", err);
		}

		// Delete the submission record
		await prisma.xcTrackSubmission.delete({
			where: { id },
		});

		// Recalculate XcProgress for this user/edition/category
		const { task } = submission;

		const existingProgress = await prisma.xcProgress.findUnique({
			where: {
				userId_editionId_category: {
					userId: submission.userId,
					editionId: submission.editionId,
					category: task.category,
				},
			},
		});

		if (existingProgress) {
			// Recalculate points from remaining approved submissions
			const { _sum, _count } = await prisma.xcTrackSubmission.aggregate({
				where: {
					userId: submission.userId,
					editionId: submission.editionId,
					task: { category: task.category },
					status: "APPROVED",
				},
				_sum: { pointsAwarded: true },
				_count: true,
			});

			if (_count === 0) {
				// No more approved submissions — reset progress
				await prisma.xcProgress.delete({
					where: {
						id: existingProgress.id,
					},
				});
			} else {
				const totalPoints = _sum.pointsAwarded ?? 0;

				// Recalculate flight stats from remaining approved submissions' flightData
				const remainingSubmissions = await prisma.xcTrackSubmission.findMany({
					where: {
						userId: submission.userId,
						editionId: submission.editionId,
						task: { category: task.category },
						status: "APPROVED",
					},
					select: { flightData: true },
				});

				let totalDistanceKm = 0;
				let flightTimeHrs = 0;
				let maxAltM = 0;

				for (const sub of remainingSubmissions) {
					const fd = sub.flightData as {
						stats?: {
							totalDistanceKm?: number;
							durationSeconds?: number;
							maxAltitude?: number;
						};
					} | null;
					if (fd?.stats) {
						totalDistanceKm += fd.stats.totalDistanceKm ?? 0;
						flightTimeHrs += (fd.stats.durationSeconds ?? 0) / 3600;
						maxAltM = Math.max(maxAltM, fd.stats.maxAltitude ?? 0);
					}
				}

				await prisma.xcProgress.update({
					where: {
						userId_editionId_category: {
							userId: submission.userId,
							editionId: submission.editionId,
							category: task.category,
						},
					},
					data: {
						points: totalPoints,
						totalDistanceKm,
						flightTimeHrs,
						maxAltM,
						completedAt:
							totalPoints >= existingProgress.minPoints
								? existingProgress.completedAt
								: null,
					},
				});
			}
		}

		return Response.json({ success: true });
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "DELETE /xc/submissions/[id]",
			id,
		});
	}
}
