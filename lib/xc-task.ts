// The QR-code folder name on disk contains a space ("QR Code"); keep it
// pre-encoded as %20 so the value is usable directly as an <img src> / href.
// Do NOT run encodeURIComponent on the whole path — it would encode the slashes.
const QR_BASE = "/xcmontegrappa/QR%20Code";

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
 * Download a task as a .xctsk file. Centralizes the fetch->blob->anchor logic
 * previously duplicated across the XC task components.
 */
export async function downloadXcTask(
	taskId: string,
	taskFileUrl?: string | null,
): Promise<void> {
	if (!taskId || !taskFileUrl) return;
	const res = await fetch(`/api/xc/tasks/${taskId}/download`);
	if (!res.ok) throw new Error("Download failed");
	const blob = await res.blob();
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = (taskFileUrl.split("/").pop() || "task.tsk").replace(
		/\.tsk$/,
		".xctsk",
	);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}
