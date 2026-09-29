import z from "zod";

export const IdParamsSchema = z.object({
	id: z.string(),
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
	flightData: z.any().nullish(),
	reviewedAt: z.coerce
		.date()
		.transform((val) => val.toISOString())
		.nullish(),
	reviewedBy: z.string().nullish(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	updatedAt: z.coerce.date().transform((val) => val.toISOString()),
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
	submissions: z.array(XcSubmissionSchema).optional(),
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
	totalDistanceKm: z.number(),
	flightTimeHrs: z.number(),
	maxAltM: z.number(),
	completedAt: z.coerce
		.date()
		.transform((val) => val.toISOString())
		.nullish(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	updatedAt: z.coerce.date().transform((val) => val.toISOString()),
});

export const XcEditionSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string().nullish(),
	startsAt: z.coerce.date().transform((val) => val.toISOString()),
	endsAt: z.coerce.date().transform((val) => val.toISOString()),
	isActive: z.boolean(),
	minPoints: z.number(),
	maxPoints: z.number(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	updatedAt: z.coerce.date().transform((val) => val.toISOString()),
	tasks: z.array(XcTaskSchema),
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

export const XcLeaderboardEntrySchema = z.object({
	rank: z.number(),
	userId: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	image: z.string().nullish(),
	points: z.number(),
	totalDistanceKm: z.number(),
	flightTimeHrs: z.number(),
	maxAltM: z.number(),
	completedAt: z.coerce
		.date()
		.transform((val) => val.toISOString())
		.nullish(),
});

export const XcEditionSummarySchema = z.object({
	id: z.number(),
	title: z.string(),
	isActive: z.boolean(),
	startsAt: z.coerce.date().transform((val) => val.toISOString()),
	endsAt: z.coerce.date().transform((val) => val.toISOString()),
});

export const XcPilotSummarySchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	image: z.string().nullish(),
});

export const XcPilotEditionSchema = z.object({
	id: z.number(),
	title: z.string(),
	isActive: z.boolean(),
});

export const XcPilotCategoryStatsSchema = z.object({
	category: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED"]),
	points: z.number(),
	minPoints: z.number(),
	maxPoints: z.number(),
	rank: z.number().nullable(),
	totalPilots: z.number(),
	tasksCompleted: z.number(),
	tasksTotal: z.number(),
	totalDistanceKm: z.number(),
	flightTimeHrs: z.number(),
	maxAltM: z.number(),
	completedAt: z.coerce
		.date()
		.transform((val) => val.toISOString())
		.nullish(),
});

export const XcPilotFlightSchema = z.object({
	id: z.string(),
	editionId: z.number(),
	pointsAwarded: z.number(),
	createdAt: z.coerce.date().transform((val) => val.toISOString()),
	task: z.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		category: z.enum(["BASIC", "INTERMEDIATE", "ADVANCED"]),
		points: z.number(),
		distanceKm: z.number().nullish(),
		taskFileUrl: z.string().nullish(),
	}),
	stats: z
		.object({
			duration: z.string().nullish(),
			durationSeconds: z.number().nullish(),
			totalDistanceKm: z.number().nullish(),
			maxAltitude: z.number().nullish(),
			minAltitude: z.number().nullish(),
			startTime: z.string().nullish(),
			endTime: z.string().nullish(),
		})
		.nullish(),
});

export const XcPilotProfileSchema = z.object({
	user: XcPilotSummarySchema,
	editions: z.array(XcPilotEditionSchema),
	edition: z
		.object({
			id: z.number(),
			title: z.string(),
			minPoints: z.number(),
			maxPoints: z.number(),
			isActive: z.boolean(),
		})
		.nullable(),
	totals: z.object({
		points: z.number(),
		flights: z.number(),
		totalDistanceKm: z.number(),
		flightTimeHrs: z.number(),
		maxAltM: z.number(),
		levelsCompleted: z.number(),
	}),
	categories: z.array(XcPilotCategoryStatsSchema),
	flights: z.array(XcPilotFlightSchema),
});

export const EventCoverUploadBodySchema = z
	.any()
	.describe("Event cover image (JPEG, PNG or WebP, up to 5 MB)");

export const EventCoverUploadResponseSchema = z.object({
	url: z.string(),
});
