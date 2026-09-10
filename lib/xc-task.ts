import { XC_PUBLIC_ASSETS_BASE_URL } from "@/config/constants";

const QR_BASE = `${XC_PUBLIC_ASSETS_BASE_URL}/xcmontegrappa/qr-codes`;

const CATEGORY_LETTER: Record<string, string> = {
	BASIC: "B",
	INTERMEDIATE: "I",
	ADVANCED: "A",
};

/**
 * Map a task to its QR image URL, or null if it can't be derived.
 *
 * QR files are per-category (A/I/B + 01..10) while the task slug uses a global
 * index (B1..B10, S11..S20, G21..G30), so the number is re-based to 1..10 and
 * the letter comes from `category` — not from the slug/.tsk prefix (S→I, G→A).
 */
export function qrCodeUrlForTask(
	category?: string | null,
	slug?: string | null,
): string | null {
	if (!category || !slug) return null;
	const letter = CATEGORY_LETTER[category.toUpperCase()];
	if (!letter) return null;
	const globalNum = Number.parseInt(slug.replace(/\D/g, ""), 10); // B1->1, S11->11, G21->21
	if (!Number.isFinite(globalNum) || globalNum < 1) return null;
	const perCat = ((globalNum - 1) % 10) + 1; // 11->1, 21->1, 10->10
	if (perCat < 1 || perCat > 10) return null;
	return `${QR_BASE}/${letter}${String(perCat).padStart(2, "0")}.jpg`;
}

/**
 * Fetch a URL and save the response as a file.
 *
 * The assets are served from a different origin than the app, and <a download>
 * is ignored cross-origin unless the response carries Content-Disposition — so
 * the bytes have to go through a blob to get a real "save as".
 */
export async function downloadBlobFromUrl(
	url: string,
	fileName: string,
): Promise<void> {
	const res = await fetch(url);
	if (!res.ok) throw new Error("Download failed");
	const blob = await res.blob();
	const objectUrl = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = objectUrl;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(objectUrl);
}

/**
 * Download a task as a .xctsk file. Goes through the app's download route
 * rather than the bucket directly, which resolves the .tsk -> .xctsk mapping
 * server-side.
 */
export async function downloadXcTask(
	taskId: string,
	taskFileUrl?: string | null,
): Promise<void> {
	if (!taskId || !taskFileUrl) return;
	const fileName = (taskFileUrl.split("/").pop() || "task.tsk").replace(
		/\.tsk$/,
		".xctsk",
	);
	await downloadBlobFromUrl(`/api/xc/tasks/${taskId}/download`, fileName);
}
