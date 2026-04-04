import type z from "zod";
import type {
	XcEnrollmentSchema,
	XcProgressSchema,
	XcTaskSchema,
} from "@/schemas/api";

export type XcTaskApi = z.infer<typeof XcTaskSchema>;
export type XcProgressApi = z.infer<typeof XcProgressSchema>;
export type XcEnrollmentApi = z.infer<typeof XcEnrollmentSchema>;
