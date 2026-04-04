import type z from "zod";
import type { XcProgressSchema, XcTaskSchema } from "@/schemas/api";

export type XcTaskApi = z.infer<typeof XcTaskSchema>;
export type XcProgressApi = z.infer<typeof XcProgressSchema>;
