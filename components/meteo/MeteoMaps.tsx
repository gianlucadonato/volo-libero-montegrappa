"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { MapQuadrant } from "@/components/meteo/MapQuadrant";
import { TimeControls } from "@/components/meteo/TimeControls";
import { Button } from "@/components/ui/button";
import { useElmeteoQuadrants } from "@/hooks/use-elmeteo-quadrants";
import { buildElmeteoTimeline, findSlotIndex } from "@/lib/elmeteo-run";

type MeteoMapsProps = {
	/** Runs available to the timeline, serialised for the client boundary. */
	runs: readonly { folder: string; runStartIso: string }[];
	/** UTC instant to open on, usually now. */
	initialAtIso: string;
};

/** Hours preloaded around the current slot, matching the jump buttons. */
const preloadOffsets = [-12, -6, -3, -1, 1, 3, 6, 12];

export function MeteoMaps({ runs, initialAtIso }: MeteoMapsProps) {
	// The timeline is derived on the client rather than serialised: ~60 runs
	// travel over the wire instead of the ~380 hourly slots they expand into.
	const slots = useMemo(
		() =>
			buildElmeteoTimeline(
				runs.map(({ folder, runStartIso }) => ({
					folder,
					runStart: new Date(runStartIso),
				})),
			),
		[runs],
	);

	// The selection is an instant, not an index: a rebuilt timeline drops the
	// expired hours from the front, which shifts every index.
	const [selectedAt, setSelectedAt] = useState(() =>
		new Date(initialAtIso).getTime(),
	);

	// A fresh `initialAtIso` means the server re-rendered — a refresh, or a fresh
	// visit. Both should land on the present, exactly like reloading the page, so
	// the selection follows it back instead of staying where the user had
	// browsed. Adjusting during render rather than in an effect keeps the maps
	// from painting the old hour first.
	const [syncedAt, setSyncedAt] = useState(initialAtIso);
	if (syncedAt !== initialAtIso) {
		setSyncedAt(initialAtIso);
		setSelectedAt(new Date(initialAtIso).getTime());
	}

	const { maps, setQuadrantMap, resetQuadrants } = useElmeteoQuadrants();

	const index = findSlotIndex(slots, new Date(selectedAt));
	const current = slots[index];

	const preloadFrames = useMemo(() => {
		// Neighbouring hours can belong to a different run, so a frame is only
		// identified by its folder and step together.
		const frames = new Map<string, { folder: string; step: number }>();
		for (const offset of preloadOffsets) {
			const neighbour = slots[index + offset];
			if (neighbour) {
				frames.set(`${neighbour.folder}_${neighbour.step}`, {
					folder: neighbour.folder,
					step: neighbour.step,
				});
			}
		}
		return [...frames.values()];
	}, [slots, index]);

	if (!current) {
		return null;
	}

	return (
		<div className="space-y-4">
			<TimeControls
				slots={slots}
				index={index}
				onIndexChange={(next) => setSelectedAt(slots[next].at.getTime())}
			/>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{maps.map((map, position) => (
					<MapQuadrant
						// The position is the identity here: the same map may legitimately
						// appear in two quadrants.
						key={`quadrant-${position + 1}`}
						map={map}
						usedMaps={maps}
						folder={current.folder}
						step={current.step}
						preloadFrames={preloadFrames}
						priority={position < 2}
						onSelect={(next) => setQuadrantMap(position, next)}
					/>
				))}
			</div>

			<div className="flex justify-end">
				<Button variant="ghost" size="sm" onClick={resetQuadrants}>
					<RotateCcw className="size-3.5" />
					Ripristina mappe predefinite
				</Button>
			</div>
		</div>
	);
}
