import { headers } from "next/headers";
import { after } from "next/server";
import { cleanupElmeteoBucket } from "@/lib/elmeteo";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
	const report = await prisma.report.findFirst({
		orderBy: {
			createdAt: "desc",
		},
	});
	return Response.json(report);
};

export const POST = async (req: Request) => {
	const authorization = (await headers()).get("authorization");
	if (!authorization) {
		return Response.json({ error: "Not authenticated" }, { status: 401 });
	}
	const token = authorization.split(" ")[1];
	const authToken = "c2c52177-92e0-4852-a425-e9f521e51d5a";
	if (!token || token !== authToken) {
		return Response.json({ error: "Not authenticated" }, { status: 401 });
	}

	const body = await req.json();
	await prisma.report.create({
		data: {
			folder: body.destFolder,
			s3startTime: new Date(body.amazonS3.startTime),
			s3endTime: body.amazonS3.endTime ? new Date(body.amazonS3.endTime) : null,
			s3duration: body.amazonS3.duration,
			s3error: body.amazonS3.error,
			ftpStartTime: new Date(body.ftp.startTime),
			ftpEndTime: body.ftp.endTime ? new Date(body.ftp.endTime) : null,
			ftpDuration: body.ftp.duration,
			ftpError: body.ftp.error,
			totalFiles: body.totalFiles,
			totalUploadedFiles: body.totalUploadedFiles,
			totalBytes: body.totalBytes,
			totalMegaBytes: body.totalUploadedMegaBytes,
			startTime: new Date(body.startTime),
			endTime: body.endTime ? new Date(body.endTime) : null,
			duration: body.duration,
			error: Boolean(body.error),
		},
	});

	console.log("🐞 > Report saved!", body);

	// Prune the S3 bucket after the response is sent: the retention cleanup must
	// never delay the uploader nor fail its report.
	after(async () => {
		try {
			const result = await cleanupElmeteoBucket();
			logger.info(
				{
					bucket: result.bucket,
					totalFolders: result.totalFolders,
					deletedFolders: result.deletedFolders,
					deletedObjects: result.deletedObjects,
				},
				"ElMeteo bucket cleanup completed",
			);
		} catch (error) {
			logger.error({ error }, "ElMeteo bucket cleanup failed");
		}
	});

	return Response.json({ message: "Report saved!" });
};
