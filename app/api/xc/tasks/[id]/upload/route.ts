import { createHash } from "node:crypto";
import Boom from "@hapi/boom";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import getXcTaskById from "@/actions/xc/getXcTaskById";
import { auth } from "@/auth";
import { NEXT_YEAR } from "@/config/constants";
import APIErrorResponse from "@/helpers/APIErrorResponse";
import { prisma } from "@/lib/prisma";
import { buildObjectKey, uploadObject } from "@/lib/r2";

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
			console.log("🐞 > session:", session);
			return APIErrorResponse(Boom.unauthorized());
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

		const objectKey = buildObjectKey({
			year: new Date().getFullYear(),
			userId: session.user.id,
			taskId: `${task.category}-${task.slug}-${task.id}`,
			fileName: file.name,
		});

		await uploadObject({
			objectKey,
			body: uint8Array,
			contentType: "application/octet-stream",
		});

		// Create a new track submission record in the database
		const submission = await prisma.xcTrackSubmission.create({
			data: {
				userId: session.user.id,
				editionId: NEXT_YEAR,
				taskId: task.id,
				fileName: objectKey,
				checksum,
			},
		});

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
