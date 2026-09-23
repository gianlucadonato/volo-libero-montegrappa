"use client";

import { Plus, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { MapPicker } from "@/components/meteo/MapPicker";
import { MapQuadrant } from "@/components/meteo/MapQuadrant";
import { TimeControls } from "@/components/meteo/TimeControls";
import { Button } from "@/components/ui/button";
import { useElmeteoQuadrants } from "@/hooks/use-elmeteo-quadrants";
import { maxQuadrants } from "@/lib/elmeteo-maps";
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
	const t = useTranslations("MeteoPage.Maps");
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

	const { maps, setQuadrantMap, addQuadrant, removeQuadrant, resetQuadrants } =
		useElmeteoQuadrants();

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
			{/* The grid runs several screens deep, and the hour is what the whole
			    page is about — so the controls follow the scroll instead of being
			    left at the top. `top-18` clears the layout's fixed header, and the
			    band is opaque and full-bleed across the container's padding so the
			    maps pass behind it rather than through the gap above the card.
			    Below the header's own z-100, so the two never fight. */}
			<div className="-mx-4 sticky top-18 z-30 bg-background px-4 pt-2 pb-2">
				<TimeControls
					slots={slots}
					index={index}
					onIndexChange={(next) => setSelectedAt(slots[next].at.getTime())}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{maps.map((map, position) => (
					<MapQuadrant
						// A map appears at most once, so it identifies its quadrant: closing
						// one in the middle leaves the others mounted, with their frames
						// already loaded, instead of remounting every quadrant after it.
						key={map}
						map={map}
						usedMaps={maps}
						folder={current.folder}
						step={current.step}
						preloadFrames={preloadFrames}
						priority={position < 2}
						onSelect={(next) => setQuadrantMap(position, next)}
						// The grid always keeps one quadrant, so the last one cannot be
						// closed.
						onRemove={
							maps.length > 1 ? () => removeQuadrant(position) : undefined
						}
					/>
				))}

				{/* Uniqueness makes this exactly "some map is still unused": the tile
				    goes away rather than opening a picker with nothing left to pick. */}
				{maps.length < maxQuadrants && (
					<MapPicker usedMaps={maps} onSelect={addQuadrant}>
						<button
							type="button"
							className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<span className="rounded-full border border-dashed p-2">
								<Plus className="size-5" />
							</span>
							<span className="font-medium text-sm">{t("add_map")}</span>
						</button>
					</MapPicker>
				)}
			</div>

			<div className="flex justify-end">
				<Button variant="ghost" size="sm" onClick={resetQuadrants}>
					<RotateCcw className="size-3.5" />
					{t("reset_maps")}
				</Button>
			</div>
		</div>
	);
}
