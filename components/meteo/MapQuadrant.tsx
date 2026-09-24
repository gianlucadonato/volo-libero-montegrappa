"use client";

import {
	ExternalLink,
	Loader2,
	Maximize2,
	SlidersHorizontal,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
import { elmeteoFrameUrl } from "@/lib/elmeteo-forecast-frame";
import {
	type ElmeteoMapDetails,
	type ElmeteoMapId,
	elmeteoSiteLegend,
	getElmeteoMap,
} from "@/lib/elmeteo-maps";
import { cn } from "@/lib/utils";

/**
 * The elmeteo.it explanation of a map, as it appears on the source page: the
 * red note first, then the site legend it introduces, then the prose and the
 * legend of the layers.
 */
function MapDetails({
	details,
	className,
}: {
	details: ElmeteoMapDetails;
	className?: string;
}) {
	return (
		<div className={cn("space-y-3 text-muted-foreground text-sm", className)}>
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
	/** Frames kept mounted around the current one, so a jump feels instant. */
	preloadFrames: { folder: string; step: number }[];
	priority: boolean;
	onSelect: (map: ElmeteoMapId) => void;
	/** Left out for the last quadrant, which the grid always keeps. */
	onRemove?: () => void;
};

export function MapQuadrant({
	map,
	usedMaps,
	folder,
	step,
	preloadFrames,
	priority,
	onSelect,
	onRemove,
}: MapQuadrantProps) {
	const t = useTranslations("MeteoPage.Maps");
	const definition = getElmeteoMap(map);
	// Tracking which URL finished loading rather than a boolean: changing the
	// hour or the map swaps the frame, and the spinner has to come back for the
	// new one instead of staying dismissed after the first load.
	const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
	// Controlled so both the header button and the frame itself can open it, while
	// focus still returns to the header button on close.
	const [zoomed, setZoomed] = useState(false);
	const currentUrl = elmeteoFrameUrl(folder, map, step);
	const loaded = loadedUrl === currentUrl;

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
								aria-label={t("zoom", { map: definition.label })}
							>
								<Maximize2 className="size-4" />
							</Button>
						</DialogTrigger>
						{/* The layout's header is fixed and stacks above the dialog, so on
						    phones the dialog starts below it, with the same 1rem gap it
						    leaves at the bottom; when centred it is clamped so the close
						    button can never end up behind the header either. */}
						<DialogContent className="top-22 grid max-h-[calc(100dvh-6.5rem)] grid-rows-[auto_minmax(0,1fr)] translate-y-0 overflow-hidden sm:top-1/2 sm:max-h-[calc(100dvh-10rem)] sm:max-w-4xl sm:-translate-y-1/2">
							{/* Padded on the end so a long title never runs under the close
							    button, which sits in the same row. */}
							<DialogHeader className="pe-10">
								<DialogTitle>{definition.label}</DialogTitle>
							</DialogHeader>
							{/* The explanation can be several paragraphs long, so the body
							    scrolls on its own — the dialog frame stays put and keeps the
							    close button reachable at the top right. */}
							<div className="-mx-4 overflow-y-auto px-4">
								{/* The dialog still shrinks the map to fit, so opening the raw
								    frame in a tab is the way to read it at full size and pinch
								    to zoom. The route is same-origin and cookie-authenticated,
								    so a plain navigation carries the session. */}
								<a
									href={currentUrl}
									target="_blank"
									rel="noopener noreferrer"
									title={t("open_fullscreen_title")}
									className="group/frame relative block cursor-zoom-in rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									{/* biome-ignore lint/performance/noImgElement: the frame route already serves an optimised WebP */}
									<img
										src={currentUrl}
										alt={definition.description}
										className="w-full rounded-lg"
									/>
									<span className="pointer-events-none absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-xs shadow-sm ring-1 ring-foreground/10 transition-opacity group-hover/frame:opacity-100 sm:opacity-0">
										<ExternalLink className="size-3.5" />
										{t("open_fullscreen")}
									</span>
								</a>
								<MapDetails details={definition.details} className="mt-4" />
							</div>
						</DialogContent>
					</Dialog>

					<MapPicker value={map} usedMaps={usedMaps} onSelect={onSelect}>
						<Button
							variant="ghost"
							size="icon"
							aria-label={t("change_map", { map: definition.label })}
						>
							<SlidersHorizontal className="size-4" />
						</Button>
					</MapPicker>

					{onRemove && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onRemove}
							aria-label={t("remove_map", { map: definition.label })}
						>
							<X className="size-4" />
						</Button>
					)}
				</div>
			</div>

			<button
				type="button"
				onClick={() => setZoomed(true)}
				aria-label={t("zoom", { map: definition.label })}
				className="relative block w-full cursor-zoom-in aspect-[844/766] bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
			>
				{!loaded && (
					<div className="absolute inset-0 flex items-center justify-center">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				)}
				{/* biome-ignore lint/performance/noImgElement: the frame route already serves an optimised WebP */}
				<img
					// Remounting on map/step change keeps the spinner honest: without a
					// key the old frame would linger while the new one downloads.
					key={currentUrl}
					// Preloaded hours are served from the cache, where the load event can
					// fire before React attaches onLoad — ask the element directly, or the
					// spinner would never clear.
					ref={(node) => {
						if (node?.complete) setLoadedUrl(currentUrl);
					}}
					src={currentUrl}
					alt={`${definition.label} — ${definition.description}`}
					loading={priority ? "eager" : "lazy"}
					decoding="async"
					onLoad={() => setLoadedUrl(currentUrl)}
					onError={() => setLoadedUrl(currentUrl)}
					className={cn(
						"absolute inset-0 size-full object-contain transition-opacity",
						!loaded && "opacity-0",
					)}
				/>
			</button>

			{/* Neighbouring hours are fetched at low priority so the ± buttons paint
			    from the browser cache instead of waiting on S3. */}
			<div aria-hidden className="hidden">
				{preloadFrames.map((frame) => (
					// biome-ignore lint/performance/noImgElement: preload only, never painted
					<img
						key={`${frame.folder}_${frame.step}`}
						src={elmeteoFrameUrl(frame.folder, map, frame.step)}
						alt=""
						loading="lazy"
						decoding="async"
					/>
				))}
			</div>
		</div>
	);
}
