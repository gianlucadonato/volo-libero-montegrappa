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
		id: z.number(),
		title: z.string(),
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
		id: z.number(),
		title: z.string(),
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
	validationResult: z.any().nullish(),
	reviewedAt: z.coerce
		.date()
		.transform((val) => val.toISOString())
		.nullish(),
	reviewedBy: z.string().nullish(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	updatedAt: z.coerce.date().transform((val) => val.toISOString()),
});

const IGCFixSchema = z.object({
	timestamp: z.number(),
	time: z.string(),
	latitude: z.number(),
	longitude: z.number(),
	valid: z.boolean(),
	pressureAltitude: z.number().nullable(),
	gpsAltitude: z.number().nullable(),
});

const IGCHeaderSchema = z.object({
	date: z.string().nullable(),
	pilot: z.string().nullable(),
	gliderType: z.string().nullable(),
	registration: z.string().nullable(),
	site: z.string().nullable(),
});

const IGCFlightStatsSchema = z.object({
	durationSeconds: z.number(),
	duration: z.string(),
	maxAltitude: z.number(),
	minAltitude: z.number(),
	totalDistanceKm: z.number(),
	startTime: z.string().nullable(),
	endTime: z.string().nullable(),
	fixCount: z.number(),
});

export const XcTrackResponseSchema = z
	.object({
		submissionId: z.string(),
		status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
		header: IGCHeaderSchema,
		stats: IGCFlightStatsSchema,
		fixes: z.array(IGCFixSchema),
	})
	.nullable();
