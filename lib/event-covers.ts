import { EVENT_COVERS_BASE_URL, EVENT_COVERS_PREFIX } from "@/config/constants";
import { uploadPublicImage } from "@/lib/public-images";

/**
 * Event covers live in the public assets bucket under their own prefix, so the
 * URL stored on the event can be handed as-is to next/image and to Telegram.
 *
 * Server-side only (sharp, S3 SDK), but not marked "server-only": the cover
 * migration script imports it from plain Node.
 */
export {
	decodeImageDataUrl,
	processPublicImage as processEventCover,
	publicImageMaxWidth as eventCoverMaxWidth,
} from "@/lib/public-images";

/** Public URL of a cover, given its file name under the covers prefix. */
export function eventCoverUrl(fileName: string): string {
	return `${EVENT_COVERS_BASE_URL}${fileName}`;
}

/** Re-encodes and uploads a cover, returning its public URL. */
export function uploadEventCover(input: Uint8Array): Promise<string> {
	return uploadPublicImage(input, EVENT_COVERS_PREFIX);
}
