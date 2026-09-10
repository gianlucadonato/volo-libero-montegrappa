import { XC_PUBLIC_ASSETS_BASE_URL } from "@/config/constants";
import { env } from "@/env";

// Every XC public asset lives under this single prefix, both in the bucket and
// in the legacy public/ layout.
const XC_ASSETS_PREFIX = "xcmontegrappa/";

export function getXcPublicBucket() {
	if (!env.AWS_S3_XC_PUBLIC_BUCKET) {
		throw new Error(
			"XC public assets are not configured: missing AWS_S3_XC_PUBLIC_BUCKET",
		);
	}
	return env.AWS_S3_XC_PUBLIC_BUCKET;
}

/**
 * Resolve a stored task URL to its object key in the public bucket.
 *
 * Accepts both forms on purpose: rows hold "/xcmontegrappa/basic/01/b01.tsk"
 * until the URL migration runs and the absolute bucket URL afterwards, so the
 * app keeps working either side of it.
 *
 * Returns null for anything outside the XC prefix — the previous
 * `join(process.cwd(), "public", url)` would happily follow "../" out of the
 * public folder, and these URLs reach us straight from the database.
 */
export function xcAssetObjectKey(url?: string | null): string | null {
	if (!url) return null;

	let key = url.startsWith(XC_PUBLIC_ASSETS_BASE_URL)
		? url.slice(XC_PUBLIC_ASSETS_BASE_URL.length)
		: url;

	// Strip a query string / fragment before decoding, then normalise the
	// leading slash left by both the absolute and the root-relative form.
	key = key.split(/[?#]/)[0].replace(/^\/+/, "");

	try {
		key = decodeURIComponent(key);
	} catch {
		// A malformed %-escape means we can't trust the path at all.
		return null;
	}

	if (!key.startsWith(XC_ASSETS_PREFIX)) return null;
	// decodeURIComponent can reveal a traversal that was hidden as %2E%2E.
	if (key.split("/").includes("..")) return null;

	return key;
}

/** Absolute public URL for an object key such as "xcmontegrappa/qr-codes/B01.jpg". */
export function xcAssetUrl(objectKey: string): string {
	return `${XC_PUBLIC_ASSETS_BASE_URL}/${objectKey.replace(/^\/+/, "")}`;
}
