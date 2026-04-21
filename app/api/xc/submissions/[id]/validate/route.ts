import { readFileSync } from "node:fs";
import { join } from "node:path";
import Boom from "@hapi/boom";
import { headers } from "next/headers";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { parseIGC } from "@/lib/igc-parser";
import { prisma } from "@/lib/prisma";
import { downloadObject } from "@/lib/r2";
import { validateTrack } from "@/lib/track-validator";
import { parseTskXml } from "@/lib/tsk-parser";
import { minPointsForCategory } from "@/store/xc";

/**
 * /xc/submissions/[id]/validate
 * @description Validate a submission's IGC track against the task's TSK waypoints
 * @pathParams IdParamsSchema
 * @auth
 */
export async function POST(
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

		const { task } = submission;

		if (!task.taskFileUrl) {
			return APIErrorResponse(
				Boom.badRequest("Task has no .tsk file configured"),
			);
		}

		// Parse the .tsk file from the public folder
		const tskPath = join(process.cwd(), "public", task.taskFileUrl);
		const tskContent = readFileSync(tskPath, "utf-8");
		const parsedTask = parseTskXml(tskContent);

		if (parsedTask.waypoints.length === 0) {
			return APIErrorResponse(
				Boom.badRequest("Task file contains no waypoints"),
			);
		}

		// Download and parse the IGC file from R2
		const igcContent = await downloadObject(submission.fileName);
		const parsedIgc = parseIGC(igcContent);

		// Validate track against waypoints
		const result = validateTrack(parsedIgc.fixes, parsedTask.waypoints);

		// Update submission with validation results
		const updatedSubmission = await prisma.xcTrackSubmission.update({
			where: { id: submission.id },
			data: {
				status: result.valid ? "APPROVED" : "REJECTED",
				pointsAwarded: result.valid ? task.points : 0,
				validationResult: JSON.parse(JSON.stringify(result)),
			},
		});

		// Update XcProgress when submission is approved
		if (result.valid) {
			const edition = await prisma.xcEdition.findUniqueOrThrow({
				where: { id: submission.editionId },
			});

			const minPoints = minPointsForCategory(task.category, edition);

			// Sum all approved points for this user/edition/category
			const { _sum } = await prisma.xcTrackSubmission.aggregate({
				where: {
					userId: submission.userId,
					editionId: submission.editionId,
					task: { category: task.category },
					status: "APPROVED",
				},
				_sum: { pointsAwarded: true },
			});

			const totalPoints = _sum.pointsAwarded ?? 0;

			// Compute aggregated flight stats from current progress + this flight
			const existingProgress = await prisma.xcProgress.findUnique({
				where: {
					userId_editionId_category: {
						userId: submission.userId,
						editionId: submission.editionId,
						category: task.category,
					},
				},
			});

			const flightDistanceKm = parsedIgc.stats.totalDistanceKm;
			const flightTimeHrs = parsedIgc.stats.durationSeconds / 3600;
			const flightMaxAlt = parsedIgc.stats.maxAltitude;

			const newTotalDistanceKm =
				(existingProgress?.totalDistanceKm ?? 0) + flightDistanceKm;
			const newFlightTimeHrs =
				(existingProgress?.flightTimeHrs ?? 0) + flightTimeHrs;
			const newMaxAltM = Math.max(existingProgress?.maxAltM ?? 0, flightMaxAlt);

			await prisma.xcProgress.upsert({
				where: {
					userId_editionId_category: {
						userId: submission.userId,
						editionId: submission.editionId,
						category: task.category,
					},
				},
				update: {
					points: totalPoints,
					totalDistanceKm: newTotalDistanceKm,
					flightTimeHrs: newFlightTimeHrs,
					maxAltM: newMaxAltM,
					completedAt: totalPoints >= minPoints ? new Date() : null,
				},
				create: {
					userId: submission.userId,
					editionId: submission.editionId,
					category: task.category,
					points: totalPoints,
					minPoints,
					totalDistanceKm: flightDistanceKm,
					flightTimeHrs: flightTimeHrs,
					maxAltM: flightMaxAlt,
					completedAt: totalPoints >= minPoints ? new Date() : null,
				},
			});
		}

		return Response.json({
			submissionId: updatedSubmission.id,
			status: updatedSubmission.status,
			valid: result.valid,
			summary: result.summary,
			pointsAwarded: updatedSubmission.pointsAwarded,
			waypoints: result.waypoints,
		});
	} catch (error) {
		return APIErrorResponse(error, {
			endpoint: "POST /xc/submissions/[id]/validate",
			id,
		});
	}
}
