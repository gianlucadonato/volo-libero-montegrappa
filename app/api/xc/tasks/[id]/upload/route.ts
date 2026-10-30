import { createHash } from "node:crypto";
import Boom from "@hapi/boom";
import { format, isValid, isWithinInterval, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import getXcTaskById from "@/actions/xc/getXcTaskById";
import { auth } from "@/auth";
import { env } from "@/env";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { parseIGC } from "@/lib/igc-parser";
import { prisma } from "@/lib/prisma";
import { buildObjectKey, deleteObject, uploadObject } from "@/lib/r2";
import { xcSeasonBounds, xcSeasonYear } from "@/lib/xc-season";
import { Prisma } from "@/prisma/generated/client";

const isProduction = env.VLM_ENV === "production";

// A flight counts only if it was flown within the season being uploaded to.
function isFlightDateValid(
	igcDateIso: string | null,
	season: { start: Date; end: Date },
): boolean {
	if (!igcDateIso) return false;
	const flightDate = parseISO(`${igcDateIso}T00:00:00Z`);
	if (!isValid(flightDate)) return false;
	return isWithinInterval(flightDate, season);
}

function formatDay(date: Date): string {
	return format(date, "d MMMM yyyy", { locale: it });
}

/**
 * /xc/tasks/[id]/upload
 * @description Upload an IGC track file for a specific XC task to Cloudflare R2
 * @pathParams IdParamsSchema
 * @body XcUploadTrackBodySchema
 * @contentType multipart/form-data
 * @response XcUploadTrackResponseSchema
 * @auth
 * @openapi
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session) {
			return APIErrorResponse(Boom.unauthorized());
		}

		const seasonYear = xcSeasonYear();
		const season = xcSeasonBounds(seasonYear);

		const enrollment = await prisma.xcEnrollment.findUnique({
			where: {
				userId_editionId: {
					userId: session.user.id,
					editionId: seasonYear,
				},
			},
		});
		if (!enrollment) {
			return APIErrorResponse(Boom.forbidden("Not enrolled in XC edition"));
		}

		const { id } = await params;
		const task = await getXcTaskById(id);

		if (!task) {
			return APIErrorResponse(Boom.notFound("Task not found"));
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return APIErrorResponse(Boom.badRequest("No file provided"));
		}

		if (!file.name.toLowerCase().endsWith(".igc")) {
			return APIErrorResponse(Boom.badRequest("Only .igc files are allowed"));
		}

		const buffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(buffer);
		const checksum = createHash("sha256").update(uint8Array).digest("hex");

		if (isProduction) {
			// 1. Validate IGC flight date is within the allowed edition window
			const fileText = new TextDecoder("utf-8").decode(uint8Array);
			let parsed: ReturnType<typeof parseIGC> | null = null;
			try {
				parsed = parseIGC(fileText);
			} catch {
				parsed = null;
			}
			if (!parsed || !isFlightDateValid(parsed.header.date, season)) {
				return APIErrorResponse(
					Boom.badRequest(
						`Data del volo non valida. La traccia IGC deve essere compresa tra il ${formatDay(season.start)} e il ${formatDay(season.end)}.`,
					),
				);
			}

			// 2. Prevent reusing the same IGC track across tasks/users
			const duplicate = await prisma.xcTrackSubmission.findFirst({
				where: {
					checksum,
				},
				include: {
					user: { select: { firstName: true, lastName: true } },
					task: { select: { name: true } },
				},
			});
			if (duplicate) {
				if (duplicate.userId !== session.user.id) {
					return APIErrorResponse(
						Boom.conflict(
							`Questa traccia IGC risulta già attribuita al pilota "${duplicate.user.firstName} ${duplicate.user.lastName}". Se è tua contattaci che verifichiamo.`,
						),
					);
				}
				return APIErrorResponse(
					Boom.conflict(
						`Questa traccia IGC risulta già in uso per ${duplicate.task.name}. Non puoi riutilizzare la stessa traccia per più tasks.`,
					),
				);
			}
		}

		const objectKey = buildObjectKey({
			year: seasonYear,
			userId: session.user.id,
			taskId: `${task.category}-${task.slug}-${task.id}`,
			fileName: file.name,
		});

		await uploadObject({
			objectKey,
			body: uint8Array,
			contentType: "application/octet-stream",
		});

		// Check for existing submission and update or create
		const existingSubmission = await prisma.xcTrackSubmission.findFirst({
			where: {
				userId: session.user.id,
				taskId: task.id,
				editionId: seasonYear,
			},
		});

		let submission: { id: string };
		if (existingSubmission) {
			// Delete old R2 file
			try {
				await deleteObject(existingSubmission.fileName);
			} catch (err) {
				console.error("Failed to delete old R2 object:", err);
			}

			// Reset submission to PENDING with new file
			submission = await prisma.xcTrackSubmission.update({
				where: { id: existingSubmission.id },
				data: {
					fileName: objectKey,
					checksum,
					status: "PENDING",
					pointsAwarded: 0,
					validationResult: Prisma.DbNull,
					flightData: Prisma.DbNull,
					notes: null,
					reviewedAt: null,
					reviewedBy: null,
				},
			});
		} else {
			submission = await prisma.xcTrackSubmission.create({
				data: {
					userId: session.user.id,
					editionId: seasonYear,
					taskId: task.id,
					fileName: objectKey,
					checksum,
				},
			});
		}

		return NextResponse.json(
			{
				success: true,
				filename: file.name,
				objectKey,
				submissionId: submission.id,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.log("🐞 > error:", error);
		return APIErrorResponse(error, { message: "Failed to upload file" });
	}
}
