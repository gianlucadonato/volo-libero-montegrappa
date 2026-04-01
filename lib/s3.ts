import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";

const maxUploadTtlSeconds = 300;

let client: S3Client | undefined;

function getS3Client() {
	if (client) {
		return client;
	}

	if (!env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
		throw new Error("S3 is not configured: missing AWS credentials or region");
	}

	client = new S3Client({
		region: env.AWS_REGION,
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY_ID,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
		},
	});

	return client;
}

export function buildXcTrackObjectKey(params: {
	year: number;
	userId: string;
	taskId: string;
	fileName: string;
}) {
	const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
	return `xcmontegrappa/${params.year}/${params.userId}/${params.taskId}/${Date.now()}-${randomUUID()}-${safeName}`;
}

export async function createUploadUrl(params: {
	bucket: string;
	objectKey: string;
	contentType: string;
}) {
	const command = new PutObjectCommand({
		Bucket: params.bucket,
		Key: params.objectKey,
		ContentType: params.contentType,
	});

	const signedUrl = await getSignedUrl(getS3Client(), command, {
		expiresIn: maxUploadTtlSeconds,
	});

	return { signedUrl, expiresIn: maxUploadTtlSeconds };
}
