import type z from "zod";
import type {
	XcEnrollmentSchema,
	XcLeaderboardEntrySchema,
	XcProgressSchema,
	XcSubmissionSchema,
	XcTaskSchema,
} from "@/schemas/api";

export type XcTaskApi = z.infer<typeof XcTaskSchema>;
export type XcProgressApi = z.infer<typeof XcProgressSchema>;
export type XcEnrollmentApi = z.infer<typeof XcEnrollmentSchema>;
export type XcSubmissionApi = z.infer<typeof XcSubmissionSchema>;
export type XcLeaderboardEntryApi = z.infer<typeof XcLeaderboardEntrySchema>;
