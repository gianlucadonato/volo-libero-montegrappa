import z from "zod";

export const IdParamsSchema = z.object({
	id: z.string(),
});

export const XcTaskSchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	description: z.string().nullish(),
	category: z.string(),
	points: z.number(),
	distanceKm: z.number(),
	taskFileUrl: z.string().nullish(),
	imageUrl: z.string().nullish(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	updatedAt: z.coerce.date().transform((val) => val.toISOString()),
});

export const XcProgressSchema = z.object({
	id: z.string(),
	edition: z.object({
		id: z.string(),
		title: z.string(),
		year: z.number(),
	}),
	category: z.string(),
	points: z.number(),
	minPoints: z.number(),
	completedAt: z.coerce
		.date()
		.transform((val) => val.toISOString())
		.nullish(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	updatedAt: z.coerce.date().transform((val) => val.toISOString()),
});

export const XcEnrollmentSchema = z.object({
	id: z.string(),
	edition: z.object({
		id: z.string(),
		title: z.string(),
		year: z.number(),
	}),
	userId: z.string(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	updatedAt: z.coerce.date().transform((val) => val.toISOString()),
});

export const XcSubmissionSchema = z.object({
	id: z.string(),
	userId: z.string(),
	editionId: z.number(),
	taskId: z.string(),
	status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
	fileName: z.string(),
	checksum: z.string().nullish(),
	notes: z.string().nullish(),
	pointsAwarded: z.number(),
	reviewedAt: z.coerce
		.date()
		.transform((val) => val.toISOString())
		.nullish(),
	reviewedBy: z.string().nullish(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	updatedAt: z.coerce.date().transform((val) => val.toISOString()),
});
