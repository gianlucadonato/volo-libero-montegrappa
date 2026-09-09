/**
 * Temporal model of an ElMeteo run.
 *
 * The uploader names each run folder with `new Date().toISOString()` minus the
 * trailing "Z", so the folder name is a UTC timestamp of the *upload*, not of
 * the model run. Measured against the run hour printed inside the images, the
 * model run is consistently 4 hours before the upload:
 *
 *   folder 04:36 -> run 00 UTC   folder 07:40 -> run 03 UTC
 *   folder 16:37 -> run 12 UTC   folder 19:37 -> run 15 UTC
 *
 * Each run publishes 49 hourly frames, step 0 being the run hour itself, so a
 * run covers `run` .. `run + 48h`. Navigating in time is therefore just moving
 * the step index.
 */

export const elmeteoStepCount = 49;
export const elmeteoMaxStep = elmeteoStepCount - 1;
/** Hours between the upload timestamp in the folder name and the model run. */
const uploadToRunOffsetHours = 4;
const millisecondsPerHour = 60 * 60 * 1000;

const folderPattern =
	/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/;

/**
 * Parses a run folder name into the UTC instant of the model run (step 0).
 * Returns undefined when the folder does not follow the uploader's naming.
 */
export function parseRunStart(folder: string) {
	const match = folderPattern.exec(folder);
	if (!match) {
		return undefined;
	}

	const [, year, month, day, hour, minute, second] = match;
	const uploadedAt = Date.UTC(
		Number(year),
		Number(month) - 1,
		Number(day),
		Number(hour),
		Number(minute),
		Number(second),
	);

	// Truncate to the hour: the run is always on a whole hour.
	const runAt = uploadedAt - uploadToRunOffsetHours * millisecondsPerHour;
	return new Date(
		Math.floor(runAt / millisecondsPerHour) * millisecondsPerHour,
	);
}

export function clampStep(step: number) {
	if (!Number.isFinite(step)) {
		return 0;
	}
	return Math.min(elmeteoMaxStep, Math.max(0, Math.round(step)));
}

/** UTC instant a given step of a run is valid for. */
export function getStepDate(runStart: Date, step: number) {
	return new Date(runStart.getTime() + clampStep(step) * millisecondsPerHour);
}

/**
 * Step whose validity time is closest to `target`, clamped to the run range.
 * Used to keep the selected hour when jumping between days.
 */
export function getStepForDate(runStart: Date, target: Date) {
	const offsetHours =
		(target.getTime() - runStart.getTime()) / millisecondsPerHour;
	// Floor, not round: at 23:32 rounding would land on the 00:00 frame, showing
	// a forecast for an hour that has not happened yet. The step whose hour is
	// under way is the one that describes the current weather.
	return clampStep(Math.floor(offsetHours));
}

/** S3 object key of one frame. */
export function buildFrameKey(params: {
	folder: string;
	map: string;
	step: number;
}) {
	return `${params.folder}/nord/${params.map}_${clampStep(params.step)}.png`;
}
