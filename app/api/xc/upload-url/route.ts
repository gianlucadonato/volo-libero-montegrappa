import { NextResponse } from "next/server";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { buildXcTrackObjectKey, createUploadUrl } from "@/lib/s3";
import { getSessionUser } from "@/lib/session";
import { getActiveXcEdition } from "@/lib/xc";
import {
	inferTrackTypeFromFileName,
	XcCreateUploadUrlSchema,
} from "@/schemas/xc";

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!env.AWS_S3_XC_BUCKET) {
			return NextResponse.json(
				{ error: "AWS_S3_XC_BUCKET is not configured" },
				{ status: 500 },
			);
		}

		const body = XcCreateUploadUrlSchema.parse(await request.json());
		inferTrackTypeFromFileName(body.fileName);

		const task = await prisma.xcTask.findUnique({
			where: { id: body.taskId },
			include: { category: { include: { edition: true } } },
		});

		if (!task) {
			return NextResponse.json({ error: "Task not found" }, { status: 404 });
		}

		const activeEdition = await getActiveXcEdition();
		if (!activeEdition || activeEdition.id !== task.category.editionId) {
			return NextResponse.json(
				{ error: "Task is not available in active edition" },
				{ status: 409 },
			);
		}

		const objectKey = buildXcTrackObjectKey({
			year: task.category.edition.year,
			userId: user.id,
			taskId: task.id,
			fileName: body.fileName,
		});

		const upload = await createUploadUrl({
			bucket: env.AWS_S3_XC_BUCKET,
			objectKey,
			contentType: body.contentType,
		});

		return NextResponse.json({
			uploadUrl: upload.signedUrl,
			expiresIn: upload.expiresIn,
			storageObjectKey: objectKey,
			storageBucket: env.AWS_S3_XC_BUCKET,
			editionId: task.category.editionId,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 400 },
		);
	}
}
