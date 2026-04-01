import * as z from "zod";

const supportedTrackExtensions = ["gpx", "igc"] as const;

export const XcEnrollSchema = z.object({
	editionId: z.string().min(1).optional(),
});

export const XcCreateUploadUrlSchema = z.object({
	taskId: z.string().min(1),
	fileName: z.string().min(1),
	contentType: z
		.string()
		.min(1)
		.refine(
			(value) =>
				value === "application/gpx+xml" ||
				value === "application/octet-stream" ||
				value === "application/vnd.google-earth.kml+xml" ||
				value === "text/xml" ||
				value === "application/xml",
			"Unsupported content type",
		),
	sizeBytes: z
		.number()
		.int()
		.positive()
		.max(25 * 1024 * 1024),
});

export const XcCreateSubmissionSchema = z.object({
	taskId: z.string().min(1),
	editionId: z.string().min(1),
	fileName: z.string().min(1),
	mimeType: z.string().min(1),
	sizeBytes: z.number().int().positive(),
	storageObjectKey: z.string().min(1),
	storageBucket: z.string().min(1).optional(),
	checksum: z.string().optional(),
	notes: z.string().max(1500).optional(),
});

export const XcReviewSubmissionSchema = z.object({
	status: z.enum(["APPROVED", "REJECTED"]),
	notes: z.string().max(1500).optional(),
	pointsAwarded: z.number().int().nonnegative().optional(),
});

export function inferTrackTypeFromFileName(fileName: string): "GPX" | "IGC" {
	const extension = fileName.split(".").pop()?.toLowerCase();
	if (
		!extension ||
		!supportedTrackExtensions.includes(
			extension as (typeof supportedTrackExtensions)[number],
		)
	) {
		throw new Error("File extension must be .gpx or .igc");
	}
	return extension === "igc" ? "IGC" : "GPX";
}
