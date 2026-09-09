"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { MapQuadrant } from "@/components/meteo/MapQuadrant";
import { TimeControls } from "@/components/meteo/TimeControls";
import { Button } from "@/components/ui/button";
import { useElmeteoQuadrants } from "@/hooks/use-elmeteo-quadrants";
import { clampStep, elmeteoMaxStep } from "@/lib/elmeteo-run";

type MeteoMapsProps = {
	folder: string;
	/** UTC instant of step 0, serialised for the client boundary. */
	runStartIso: string;
	initialStep: number;
};

/** Hours preloaded around the current step, matching the jump buttons. */
const preloadOffsets = [-12, -6, -3, -1, 1, 3, 6, 12];

export function MeteoMaps({
	folder,
	runStartIso,
	initialStep,
}: MeteoMapsProps) {
	const runStart = useMemo(() => new Date(runStartIso), [runStartIso]);
	const [step, setStep] = useState(() => clampStep(initialStep));
	const { maps, setQuadrantMap, resetQuadrants } = useElmeteoQuadrants();

	const preloadSteps = useMemo(() => {
		const steps = new Set<number>();
		for (const offset of preloadOffsets) {
			const candidate = step + offset;
			if (candidate >= 0 && candidate <= elmeteoMaxStep) {
				steps.add(candidate);
			}
		}
		return [...steps];
	}, [step]);

	return (
		<div className="space-y-4">
			<TimeControls
				step={step}
				runStart={runStart}
				onStepChange={(next) => setStep(clampStep(next))}
			/>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{maps.map((map, index) => (
					<MapQuadrant
						// The slot index is the identity here: the same map may legitimately
						// appear in two quadrants.
						key={`quadrant-${index + 1}`}
						map={map}
						usedMaps={maps}
						folder={folder}
						step={step}
						preloadSteps={preloadSteps}
						priority={index < 2}
						onSelect={(next) => setQuadrantMap(index, next)}
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
