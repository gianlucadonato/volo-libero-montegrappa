import type { IGCFlightStats, IGCHeader } from "@/lib/igc-parser";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

type FlightData = {
	header?: Partial<IGCHeader> | null;
	stats?: Partial<IGCFlightStats> | null;
} | null;

interface FlightTaskLike {
	id: string;
	slug: string;
	name: string;
	category: XcCategoryLevel;
	points: number;
	distanceKm: number | null;
	taskFileUrl: string | null;
}

interface FlightSubmissionLike {
	id: string;
	editionId: number;
	pointsAwarded: number;
	createdAt: Date;
	/** `Prisma.JsonValue`; only `stats` is read from it. */
	flightData: unknown;
	task: FlightTaskLike;
}

/**
 * Public projection of an approved track submission, shared by the pilot
 * profile and the single-flight page. Keeps only what those pages render —
 * never the R2 file name, the validation result or the reviewer.
 */
export function toPilotFlight(submission: FlightSubmissionLike) {
	const stats = (submission.flightData as FlightData)?.stats ?? null;

	return {
		id: submission.id,
		editionId: submission.editionId,
		pointsAwarded: submission.pointsAwarded,
		createdAt: submission.createdAt,
		task: submission.task,
		stats: stats
			? {
					duration: stats.duration ?? null,
					durationSeconds: stats.durationSeconds ?? null,
					totalDistanceKm: stats.totalDistanceKm ?? null,
					maxAltitude: stats.maxAltitude ?? null,
					minAltitude: stats.minAltitude ?? null,
					startTime: stats.startTime ?? null,
					endTime: stats.endTime ?? null,
				}
			: null,
	};
}

/** Task fields the pilot-facing pages need; keep in sync with `toPilotFlight`. */
export const PILOT_FLIGHT_TASK_SELECT = {
	id: true,
	slug: true,
	name: true,
	category: true,
	points: true,
	distanceKm: true,
	taskFileUrl: true,
} as const;
