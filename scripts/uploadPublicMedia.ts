/**
 * Uploads the heavy static media in public/ to the public assets bucket, under
 * a "media/" prefix that keeps it clear of the XC task assets.
 *
 * These files are large, never change, and are referenced by a handful of
 * static URLs, so serving them from the bucket keeps them out of every Docker
 * image without any runtime plumbing.
 *
 * Idempotent: a PutObject to an existing key is a plain overwrite, so the
 * script can be re-run at will.
 *
 * Usage:
 *   pnpm tsx scripts/uploadPublicMedia.ts --dry-run
 *   pnpm tsx scripts/uploadPublicMedia.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { putObject } from "@/lib/s3";
import { getXcPublicBucket } from "@/lib/xc-assets";

const PUBLIC_DIR = join(process.cwd(), "public");
const DRY_RUN = process.argv.includes("--dry-run");

// Filenames are content-stable, so the bytes can be cached indefinitely. The
// group photos are the exception noted below.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * Paths are relative to public/ and become "media/<path>" in the bucket.
 *
 * The group photos are recompressed before upload (6000x4000 originals shown in
 * a ~300px strip), so their filenames stay the same while the bytes change:
 * they are uploaded from a staging directory rather than from public/.
 */
const SOURCES = [
	"videos/bg-video.mp4",
	"waypoints/spazi-aerei.zip",
	"waypoints/waypoints.zip",
	"locations",
] as const;

const CONTENT_TYPES: Record<string, string> = {
	".mp4": "video/mp4",
	".zip": "application/zip",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
};

function contentTypeFor(filePath: string): string {
	const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
	const contentType = CONTENT_TYPES[ext];
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

function collect(): { filePath: string; objectKey: string }[] {
	const out: { filePath: string; objectKey: string }[] = [];

	for (const source of SOURCES) {
		const full = join(PUBLIC_DIR, source);
		if (!existsSync(full)) {
			throw new Error(`Missing source: ${full}`);
		}
		const files = statSync(full).isDirectory() ? listFiles(full) : [full];
		for (const filePath of files) {
			const rel = filePath
				.slice(PUBLIC_DIR.length + 1)
				.split("\\")
				.join("/");
			out.push({ filePath, objectKey: `media/${rel}` });
		}
	}

	return out.sort((a, b) => a.objectKey.localeCompare(b.objectKey));
}

async function main() {
	const bucket = getXcPublicBucket();
	const entries = collect();
	const totalBytes = entries.reduce(
		(sum, e) => sum + statSync(e.filePath).size,
		0,
	);

	console.log(
		`${DRY_RUN ? "🔍 [dry run] " : "⬆️  "}${entries.length} files -> s3://${bucket} (${(
			totalBytes / 1024 / 1024
		).toFixed(1)} MB)\n`,
	);

	let uploaded = 0;
	for (const { filePath, objectKey } of entries) {
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
			`   ✅ ${objectKey}  (${sizeKb} KB)  [${uploaded}/${entries.length}]`,
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
