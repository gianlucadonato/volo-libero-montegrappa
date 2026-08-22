import type z from "zod";
import type {
	XcEnrollmentSchema,
	XcLeaderboardEntrySchema,
	XcPilotCategoryStatsSchema,
	XcPilotFlightSchema,
	XcPilotProfileSchema,
	XcProgressSchema,
	XcSubmissionSchema,
	XcTaskSchema,
} from "@/schemas/api";

export type XcTaskApi = z.infer<typeof XcTaskSchema>;
export type XcProgressApi = z.infer<typeof XcProgressSchema>;
export type XcEnrollmentApi = z.infer<typeof XcEnrollmentSchema>;
export type XcSubmissionApi = z.infer<typeof XcSubmissionSchema>;
export type XcLeaderboardEntryApi = z.infer<typeof XcLeaderboardEntrySchema>;
export type XcPilotProfileApi = z.infer<typeof XcPilotProfileSchema>;
export type XcPilotCategoryStatsApi = z.infer<
	typeof XcPilotCategoryStatsSchema
>;
export type XcPilotFlightApi = z.infer<typeof XcPilotFlightSchema>;
