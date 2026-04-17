import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/env";

let client: S3Client | undefined;

function getR2Client() {
	if (client) {
		return client;
	}

	if (
		!env.R2_ACCOUNT_ID ||
		!env.R2_ACCESS_KEY_ID ||
		!env.R2_SECRET_ACCESS_KEY
	) {
		throw new Error("R2 is not configured: missing R2 credentials");
	}

	client = new S3Client({
		region: "auto",
		endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		},
	});

	return client;
}

function getBucket() {
	if (!env.R2_BUCKET_NAME) {
		throw new Error("R2 is not configured: missing R2_BUCKET_NAME");
	}
	return env.R2_BUCKET_NAME;
}

export function buildObjectKey(params: {
	year: number;
	userId: string;
	taskId: string;
	fileName: string;
}) {
	const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
	return `xcmontegrappa/${params.year}/${params.userId}/${params.taskId}/${Date.now()}-${randomUUID()}-${safeName}`;
}

export async function uploadObject(params: {
	objectKey: string;
	body: Uint8Array;
	contentType: string;
}) {
	const command = new PutObjectCommand({
		Bucket: getBucket(),
		Key: params.objectKey,
		Body: params.body,
		ContentType: params.contentType,
	});

	return getR2Client().send(command);
}
