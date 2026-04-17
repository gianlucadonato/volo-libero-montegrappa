import Boom from "@hapi/boom";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import getXcTaskById from "@/actions/xc/getXcTaskById";
import { auth } from "@/auth";
import APIErrorResponse from "@/helpers/APIErrorResponse";
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

		const objectKey = buildObjectKey({
			year: new Date().getFullYear(),
			userId: session.user.id,
			taskId: task.id,
			fileName: file.name,
		});

		await uploadObject({
			objectKey,
			body: uint8Array,
			contentType: "application/octet-stream",
		});

		return NextResponse.json(
			{
				success: true,
				filename: file.name,
				objectKey,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.log("🐞 > error:", error);
		return APIErrorResponse(error, { message: "Failed to upload file" });
	}
}
