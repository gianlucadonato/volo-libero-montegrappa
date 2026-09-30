export const NEXT_YEAR = 2026;
export const MEMBERSHIP_PRICE = 40;

// XC task maps, QR codes and .tsk/.xctsk files live in a public S3 bucket, not
// in public/: they are ~116 MB and would ship inside every Docker image.
// Hardcoded rather than read from `env` because qrCodeUrlForTask() runs in
// client components, where server-only vars are undefined. A public bucket URL
// is not a secret. The bucket name itself stays in AWS_S3_XC_PUBLIC_BUCKET for
// the server-side SDK paths (upload script, download/validate routes).
export const XC_PUBLIC_ASSETS_BASE_URL =
	"https://vlm-xc-public.s3.eu-central-1.amazonaws.com";

// The same bucket also serves the heavy static media that used to sit in
// public/ — the hero video, the airspace archives and the site photos — under a
// "media/" prefix that keeps them clear of the XC task assets.
export const PUBLIC_MEDIA_BASE_URL = `${XC_PUBLIC_ASSETS_BASE_URL}/media`;

// Event covers are uploaded through /api/events/cover and re-encoded to JPEG
// server-side; the form enforces the same limits before sending.
export const EVENT_COVER_ACCEPTED_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
];
export const EVENT_COVER_MAX_UPLOAD_MB = 5;
export const EVENT_COVERS_PREFIX = "events/covers/";
export const EVENT_COVERS_BASE_URL = `${XC_PUBLIC_ASSETS_BASE_URL}/${EVENT_COVERS_PREFIX}`;

// News covers and the images inside a news body go through /api/news/images,
// with the same limits and re-encoding as event covers.
export const NEWS_IMAGES_PREFIX = "news/images/";
export const NEWS_IMAGES_BASE_URL = `${XC_PUBLIC_ASSETS_BASE_URL}/${NEWS_IMAGES_PREFIX}`;
