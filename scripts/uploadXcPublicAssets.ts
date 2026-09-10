/**
 * Uploads public/xcmontegrappa/** to the public XC assets bucket.
 *
 * Idempotent: a PutObject to an existing key is a plain overwrite, so the
 * script can be re-run at will.
 *
 * Keys mirror the public/ layout, except the QR folder is renamed from
 * "QR Code" to "qr-codes" — dropping the space (and the %20 it forced into
 * every URL).
 *
 * Usage:
 *   pnpm tsx scripts/uploadXcPublicAssets.ts --dry-run
 *   pnpm tsx scripts/uploadXcPublicAssets.ts
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { putObject } from "@/lib/s3";
import { getXcPublicBucket } from "@/lib/xc-assets";

const PUBLIC_DIR = join(process.cwd(), "public");
const SOURCE_DIR = join(PUBLIC_DIR, "xcmontegrappa");
const DRY_RUN = process.argv.includes("--dry-run");

// Filenames are content-stable, so the bytes can be cached indefinitely.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const CONTENT_TYPES: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	// .tsk is XML and is parsed in the browser by use-xc-task-waypoints.
	".tsk": "application/xml",
	// .xctsk is an XCTrack import file: always a download, never displayed.
	".xctsk": "application/octet-stream",
};

function contentTypeFor(filePath: string): string {
	const ext = filePath.slice(filePath.lastIndexOf("."));
	const contentType = CONTENT_TYPES[ext.toLowerCase()];
	if (!contentType) {
		throw new Error(`No content type mapped for "${ext}" (${filePath})`);
	}
	return contentType;
}

function listFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) return listFiles(full);
		// .DS_Store and friends must never reach the bucket.
		return entry.name.startsWith(".") ? [] : [full];
	});
}

function objectKeyFor(filePath: string): string {
	const key = relative(PUBLIC_DIR, filePath).split(sep).join("/");
	return key.replace("xcmontegrappa/QR Code/", "xcmontegrappa/qr-codes/");
}

async function main() {
	const bucket = getXcPublicBucket();
	const files = listFiles(SOURCE_DIR).sort();
	const totalBytes = files.reduce((sum, f) => sum + statSync(f).size, 0);

	console.log(
		`${DRY_RUN ? "🔍 [dry run] " : "⬆️  "}${files.length} files -> s3://${bucket} (${(
			totalBytes / 1024 / 1024
		).toFixed(1)} MB)\n`,
	);

	let uploaded = 0;
	for (const filePath of files) {
		const objectKey = objectKeyFor(filePath);
		const contentType = contentTypeFor(filePath);
		const sizeKb = (statSync(filePath).size / 1024).toFixed(0);

		if (DRY_RUN) {
			console.log(`   ${objectKey}  (${contentType}, ${sizeKb} KB)`);
			continue;
		}

		await putObject({
			bucket,
			objectKey,
			body: readFileSync(filePath),
			contentType,
			cacheControl: CACHE_CONTROL,
		});
		uploaded += 1;
		console.log(
			`   ✅ ${objectKey}  (${sizeKb} KB)  [${uploaded}/${files.length}]`,
		);
	}

	console.log(
		DRY_RUN
			? `\n🔍 Dry run: nothing uploaded. Re-run without --dry-run to upload.`
			: `\n✨ Uploaded ${uploaded} objects to ${bucket}.`,
	);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
