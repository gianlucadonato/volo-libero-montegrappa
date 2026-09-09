import {
	DeleteObjectsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";

const maxUploadTtlSeconds = 300;

// S3 hard limit for a single DeleteObjects request.
const maxKeysPerDeleteBatch = 1000;

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

/**
 * Lists the top-level "folders" of a bucket, i.e. the common prefixes before
 * the first "/". Returns them without the trailing slash.
 */
export async function listTopLevelPrefixes(bucket: string) {
	const prefixes: string[] = [];
	let continuationToken: string | undefined;

	do {
		const result = await getS3Client().send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Delimiter: "/",
				ContinuationToken: continuationToken,
			}),
		);

		for (const commonPrefix of result.CommonPrefixes ?? []) {
			if (commonPrefix.Prefix) {
				prefixes.push(commonPrefix.Prefix.replace(/\/$/, ""));
			}
		}

		continuationToken = result.NextContinuationToken;
	} while (continuationToken);

	return prefixes;
}

/**
 * Deletes every object under a prefix, paginating the listing and batching the
 * deletes. Returns the number of deleted objects.
 */
export async function deletePrefix(params: { bucket: string; prefix: string }) {
	const s3Client = getS3Client();
	let deletedCount = 0;
	let continuationToken: string | undefined;

	do {
		const result = await s3Client.send(
			new ListObjectsV2Command({
				Bucket: params.bucket,
				Prefix: params.prefix,
				ContinuationToken: continuationToken,
			}),
		);

		const keys = (result.Contents ?? [])
			.map((object) => object.Key)
			.filter((key): key is string => Boolean(key));

		for (let i = 0; i < keys.length; i += maxKeysPerDeleteBatch) {
			const batch = keys.slice(i, i + maxKeysPerDeleteBatch);
			await s3Client.send(
				new DeleteObjectsCommand({
					Bucket: params.bucket,
					Delete: {
						Objects: batch.map((key) => ({ Key: key })),
						Quiet: true,
					},
				}),
			);
			deletedCount += batch.length;
		}

		continuationToken = result.NextContinuationToken;
	} while (continuationToken);

	return deletedCount;
}
