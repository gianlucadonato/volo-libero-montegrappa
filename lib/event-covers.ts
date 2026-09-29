import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { EVENT_COVERS_BASE_URL, EVENT_COVERS_PREFIX } from "@/config/constants";
import { putObject } from "@/lib/s3";
import { getXcPublicBucket } from "@/lib/xc-assets";

/**
 * Event covers live in the public assets bucket under their own prefix, so the
 * URL stored on the event can be handed as-is to next/image and to Telegram.
 *
 * Every cover is re-encoded to a JPEG capped at 1600px: admins upload phone
 * photos and posters straight from the camera roll, and JPEG is the one format
 * every consumer (browsers, Telegram's sendPhoto) accepts.
 *
 * Server-side only (sharp, S3 SDK), but not marked "server-only": the cover
 * migration script imports it from plain Node.
 */
export const eventCoverMaxWidth = 1600;
export const eventCoverQuality = 82;
export const eventCoverContentType = "image/jpeg";

// The key is unique per upload, so the bytes behind a URL never change.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

/** Public URL of a cover, given its file name under the covers prefix. */
export function eventCoverUrl(fileName: string): string {
	return `${EVENT_COVERS_BASE_URL}${fileName}`;
}

/** Decodes a `data:image/...;base64,` URL, as stored by the legacy form. */
export function decodeImageDataUrl(dataUrl: string): Buffer | null {
	const match = dataUrl.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i);
	if (!match) return null;
	return Buffer.from(match[1], "base64");
}

export async function processEventCover(input: Uint8Array): Promise<Buffer> {
	return (
		sharp(input)
			// Apply the EXIF orientation before it is stripped by the re-encode.
			.rotate()
			.resize({ width: eventCoverMaxWidth, withoutEnlargement: true })
			// Flatten transparent PNGs onto white rather than black.
			.flatten({ background: "#ffffff" })
			.jpeg({ quality: eventCoverQuality, mozjpeg: true })
			.toBuffer()
	);
}

/** Re-encodes and uploads a cover, returning its public URL. */
export async function uploadEventCover(input: Uint8Array): Promise<string> {
	const body = await processEventCover(input);
	const fileName = `${randomUUID()}.jpg`;

	await putObject({
		bucket: getXcPublicBucket(),
		objectKey: `${EVENT_COVERS_PREFIX}${fileName}`,
		body,
		contentType: eventCoverContentType,
		cacheControl: CACHE_CONTROL,
	});

	return eventCoverUrl(fileName);
}
