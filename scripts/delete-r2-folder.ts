import {
	DeleteObjectsCommand,
	ListObjectsV2Command,
	S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucketName = process.env.R2_BUCKET_NAME!;

const client = new S3Client({
	region: "auto",
	endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
	credentials: { accessKeyId, secretAccessKey },
});

async function deleteAllInPrefix(prefix: string) {
	let continuationToken: string | undefined;
	let totalDeleted = 0;

	do {
		const list = await client.send(
			new ListObjectsV2Command({
				Bucket: bucketName,
				Prefix: prefix,
				ContinuationToken: continuationToken,
			}),
		);

		const objects = list.Contents;
		if (!objects || objects.length === 0) break;

		console.log(`Found ${objects.length} objects to delete...`);

		await client.send(
			new DeleteObjectsCommand({
				Bucket: bucketName,
				Delete: {
					Objects: objects.map((o) => ({ Key: o.Key })),
					Quiet: true,
				},
			}),
		);

		totalDeleted += objects.length;
		continuationToken = list.NextContinuationToken;
	} while (continuationToken);

	console.log(`Done. Deleted ${totalDeleted} objects from "${prefix}".`);
}

const FOLDER = "tasks/";
deleteAllInPrefix(FOLDER);
