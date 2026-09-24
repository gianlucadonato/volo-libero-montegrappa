import {
	type ElmeteoSlot,
	elmeteoMaxStep,
	findSlotIndex,
} from "@/lib/elmeteo-run";
import { romeHourToUtc } from "@/lib/meteo-time";

/**
 * Which map frame illustrates one hour of a take-off table.
 *
 * The source's own tables put a "Clouds Maps" link in the clouds column,
 * pointing at its page for the clouds/rain/snow/MSLP map — the same map the
 * club already mirrors as `prec`. This is what lets that link be answered from
 * the club's own bucket instead: following the source's URL out of a scraped
 * page is exactly what its bot trap punishes, so the hour has to find the
 * frame here.
 *
 * The two agree on what an hour means, which is what makes the mapping exact
 * rather than approximate. A table row is captioned `until 07:00` and a frame
 * carries `Valid Wednesday 23 Sep 2026 until 05:00 (Rome)` burned into the
 * image: the same "until HH:00 (Rome)" convention on both sides, so row hour H
 * is the frame whose caption says until H:00.
 */
export const forecastCloudsMap = "prec";

/**
 * The map behind the thermals column: updraft strength between 500 and 1500 m.
 *
 * The band rather than the one above it, because the column reports the ceiling
 * a pilot can actually climb to from take-off, and the take-offs themselves sit
 * inside this layer. `term850` covers what is above the inversion, which is the
 * part the column deliberately does not show.
 */
export const forecastThermalsMap = "term950";

export type ForecastFrame = {
	folder: string;
	step: number;
};

/**
 * The frame for `(day, hour)` in the flying zone, or undefined when no run
 * reaches it.
 *
 * Day three is the case that matters: a run publishes 49 hourly frames from
 * its own hour, so the tables — which run three days out — regularly end past
 * the last frame any run covers. The caller is expected to drop the link for
 * those hours rather than open a dialog onto a frame that does not exist.
 *
 * An hour before the timeline is refused for the same reason. `findSlotIndex`
 * floors, so it answers slot 0 for anything earlier, and that frame describes a
 * different day's weather.
 */
export function findForecastFrame(
	slots: readonly ElmeteoSlot[],
	day: string,
	hour: number,
): ForecastFrame | undefined {
	const at = romeHourToUtc(day, hour);
	if (!at || slots.length === 0) {
		return undefined;
	}

	const first = slots[0];
	const last = slots[slots.length - 1];
	if (at < first.at || at > last.at) {
		return undefined;
	}

	const slot = slots[findSlotIndex(slots, at)];
	// The timeline is hourly but not guaranteed contiguous: a long uploader
	// outage leaves a stretch no run covers, and flooring into it would answer
	// with the frame from before the gap.
	if (slot.at.getTime() !== at.getTime()) {
		return undefined;
	}

	return slot.step <= elmeteoMaxStep
		? { folder: slot.folder, step: slot.step }
		: undefined;
}

/** URL of one frame on the app's own proxy. */
export function elmeteoFrameUrl(folder: string, map: string, step: number) {
	const params = new URLSearchParams({ folder, map, step: String(step) });
	return `/api/elmeteo/frame?${params.toString()}`;
}
