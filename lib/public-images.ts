import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { XC_PUBLIC_ASSETS_BASE_URL } from "@/config/constants";
import { putObject } from "@/lib/s3";
import { getXcPublicBucket } from "@/lib/xc-assets";

/**
 * Images uploaded by admins (event covers, news covers and news body images)
 * are stored in the public assets bucket and served straight from it.
 *
 * Every image is re-encoded to a JPEG capped at 1600px: admins upload phone
 * photos and posters straight from the camera roll, and JPEG is the one format
 * every consumer (browsers, Telegram's sendPhoto) accepts.
 *
 * Server-side only (sharp, S3 SDK), but not marked "server-only": migration
 * scripts import it from plain Node.
 */
export const publicImageMaxWidth = 1600;
export const publicImageQuality = 82;
export const publicImageContentType = "image/jpeg";

// The key is unique per upload, so the bytes behind a URL never change.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

/** Decodes a `data:image/...;base64,` URL, as stored by the legacy form. */
export function decodeImageDataUrl(dataUrl: string): Buffer | null {
	const match = dataUrl.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i);
	if (!match) return null;
	return Buffer.from(match[1], "base64");
}

export async function processPublicImage(input: Uint8Array): Promise<Buffer> {
	return (
		sharp(input)
			// Apply the EXIF orientation before it is stripped by the re-encode.
			.rotate()
			.resize({ width: publicImageMaxWidth, withoutEnlargement: true })
			// Flatten transparent PNGs onto white rather than black.
			.flatten({ background: "#ffffff" })
			.jpeg({ quality: publicImageQuality, mozjpeg: true })
			.toBuffer()
	);
}

/**
 * Re-encodes and uploads an image under `prefix` (e.g. "news/images/"),
 * returning its public URL.
 */
export async function uploadPublicImage(
	input: Uint8Array,
	prefix: string,
): Promise<string> {
	const body = await processPublicImage(input);
	const objectKey = `${prefix}${randomUUID()}.jpg`;

	await putObject({
		bucket: getXcPublicBucket(),
		objectKey,
		body,
		contentType: publicImageContentType,
		cacheControl: CACHE_CONTROL,
	});

	return `${XC_PUBLIC_ASSETS_BASE_URL}/${objectKey}`;
}
