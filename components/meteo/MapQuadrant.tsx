"use client";

import { Maximize2, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { MapPicker } from "@/components/meteo/MapPicker";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
	type ElmeteoMapDetails,
	type ElmeteoMapId,
	elmeteoSiteLegend,
	getElmeteoMap,
} from "@/lib/elmeteo-maps";

/**
 * The elmeteo.it explanation of a map, as it appears on the source page: the
 * red note first, then the site legend it introduces, then the prose and the
 * legend of the layers.
 */
function MapDetails({ details }: { details: ElmeteoMapDetails }) {
	return (
		<div className="space-y-3 text-muted-foreground text-sm">
			{details.warning && <p className="text-destructive">{details.warning}</p>}

			{details.sites && (
				<ul className="list-disc space-y-1 pl-5 text-destructive">
					{elmeteoSiteLegend.map((site) => (
						<li key={site}>{site}</li>
					))}
				</ul>
			)}

			{details.paragraphs.map((paragraph) => (
				<p key={paragraph}>{paragraph}</p>
			))}

			{details.bullets && (
				<ul className="list-disc space-y-1 pl-5">
					{details.bullets.map((bullet) => (
						<li key={bullet}>{bullet}</li>
					))}
				</ul>
			)}
		</div>
	);
}

type MapQuadrantProps = {
	map: ElmeteoMapId;
	usedMaps: readonly ElmeteoMapId[];
	folder: string;
	step: number;
	/** Steps kept mounted around the current one, so a jump feels instant. */
	preloadSteps: number[];
	priority: boolean;
	onSelect: (map: ElmeteoMapId) => void;
};

function frameUrl(folder: string, map: string, step: number) {
	const params = new URLSearchParams({
		folder,
		map,
		step: String(step),
	});
	return `/api/elmeteo/frame?${params.toString()}`;
}

export function MapQuadrant({
	map,
	usedMaps,
	folder,
	step,
	preloadSteps,
	priority,
	onSelect,
}: MapQuadrantProps) {
	const definition = getElmeteoMap(map);
	const [loaded, setLoaded] = useState(false);
	// Controlled so both the header button and the frame itself can open it, while
	// focus still returns to the header button on close.
	const [zoomed, setZoomed] = useState(false);
	const currentUrl = frameUrl(folder, map, step);

	return (
		<div className="group overflow-hidden rounded-xl border bg-card">
			<div className="flex items-center justify-between gap-2 border-b px-3 py-2">
				<div className="min-w-0">
					<p className="truncate font-medium text-sm">{definition.label}</p>
					<p className="truncate text-muted-foreground text-xs">
						{definition.description}
					</p>
				</div>

				<div className="flex shrink-0 items-center gap-1">
					<Dialog open={zoomed} onOpenChange={setZoomed}>
						<DialogTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label={`Ingrandisci ${definition.label}`}
							>
								<Maximize2 className="size-4" />
							</Button>
						</DialogTrigger>
						{/* The explanation can be several paragraphs long, so the dialog
						    scrolls rather than growing past the viewport. */}
						<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
							<DialogHeader>
								<DialogTitle>{definition.label}</DialogTitle>
							</DialogHeader>
							{/* biome-ignore lint/performance/noImgElement: the frame route already serves an optimised WebP */}
							<img
								src={currentUrl}
								alt={definition.description}
								className="w-full rounded-lg"
							/>
							<MapDetails details={definition.details} />
						</DialogContent>
					</Dialog>

					<MapPicker value={map} usedMaps={usedMaps} onSelect={onSelect}>
						<Button
							variant="ghost"
							size="icon"
							aria-label={`Cambia mappa nel riquadro ${definition.label}`}
						>
							<SlidersHorizontal className="size-4" />
						</Button>
					</MapPicker>
				</div>
			</div>

			<button
				type="button"
				onClick={() => setZoomed(true)}
				aria-label={`Ingrandisci ${definition.label}`}
				className="relative block w-full cursor-zoom-in aspect-[844/766] bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
			>
				{!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
				{/* biome-ignore lint/performance/noImgElement: the frame route already serves an optimised WebP */}
				<img
					// Remounting on map/step change keeps the skeleton honest: without a
					// key the old frame would linger while the new one downloads.
					key={currentUrl}
					src={currentUrl}
					alt={`${definition.label} — ${definition.description}`}
					loading={priority ? "eager" : "lazy"}
					decoding="async"
					onLoad={() => setLoaded(true)}
					onError={() => setLoaded(true)}
					className="absolute inset-0 size-full object-contain"
				/>
			</button>

			{/* Neighbouring hours are fetched at low priority so the ± buttons paint
			    from the browser cache instead of waiting on S3. */}
			<div aria-hidden className="hidden">
				{preloadSteps.map((preloadStep) => (
					// biome-ignore lint/performance/noImgElement: preload only, never painted
					<img
						key={preloadStep}
						src={frameUrl(folder, map, preloadStep)}
						alt=""
						loading="lazy"
						decoding="async"
					/>
				))}
			</div>
		</div>
	);
}
