"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	elmeteoFrameUrl,
	type ForecastFrame,
} from "@/lib/elmeteo-forecast-frame";
import { type ElmeteoMapId, getElmeteoMap } from "@/lib/elmeteo-maps";
import { cn } from "@/lib/utils";

/**
 * One hour of a forecast column, opening the map that hour is drawn from.
 *
 * The source's own tables end their clouds column with a "Clouds Maps" link,
 * telling pilots to read the figures against the clouds/rain/snow/MSLP map. Its
 * link is static — the same URL on all twelve rows — and points out of the
 * page; this one is per hour and points at the club's copy of that map, because
 * following a URL out of a scraped page is exactly what the source's bot trap
 * punishes.
 *
 * Shared by the two columns that have a map behind them, each naming its own:
 * clouds reads against `prec`, thermals against the 500-1500 m updrafts. The
 * frame is only fetched once the dialog is opened. A table is twelve rows of six
 * take-offs, and loading a map per row would cost more than the whole page does.
 */
export function ForecastMapDialog({
	frame,
	map,
	hourLabel,
	siteName,
	dayLabel,
	triggerLabel,
	triggerClassName,
	children,
}: {
	frame: ForecastFrame;
	/** Which map this column reads against. */
	map: ElmeteoMapId;
	/** The row's own hour, as the table prints it. */
	hourLabel: string;
	siteName: string;
	/** The day the row belongs to, spelled out for the dialog's subtitle. */
	dayLabel: string;
	/** What the trigger announces, since the cell itself is only figures. */
	triggerLabel: string;
	triggerClassName?: string;
	/** The trigger as its column draws it. */
	children: ReactNode;
}) {
	const t = useTranslations("MeteoPage.ForecastTable");
	const [open, setOpen] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const definition = getElmeteoMap(map);
	const url = elmeteoFrameUrl(frame.folder, map, frame.step);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button
					type="button"
					aria-label={triggerLabel}
					className={cn(
						"cursor-pointer rounded outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
						triggerClassName,
					)}
				>
					{children}
				</button>
			</DialogTrigger>

			{/* Same frame as the maps page's own zoom: the layout's header is fixed
			    and stacks above the dialog, so on phones it starts below the header
			    and when centred it is clamped so the close button stays clear of
			    it. */}
			<DialogContent className="top-22 grid max-h-[calc(100dvh-6.5rem)] grid-rows-[auto_minmax(0,1fr)] translate-y-0 overflow-hidden sm:top-1/2 sm:max-h-[calc(100dvh-10rem)] sm:max-w-4xl sm:-translate-y-1/2">
				{/* Padded on the end so the title never runs under the close button,
				    which sits in the same row. */}
				<DialogHeader className="pe-10 text-left">
					<DialogTitle>{definition.label}</DialogTitle>
					{/* Which hour is on screen, since the map is one frame of 49 and
					    nothing else in the dialog says which row opened it. */}
					<DialogDescription>
						{t("map_subtitle", {
							site: siteName,
							day: dayLabel,
							hour: hourLabel,
						})}
					</DialogDescription>
				</DialogHeader>

				<div className="-mx-4 overflow-y-auto px-4">
					{/* The dialog shrinks the map to fit, so opening the raw frame in a
					    tab is the way to read it at full size and pinch to zoom. The
					    route is same-origin and cookie-authenticated, so a plain
					    navigation carries the session. */}
					<a
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						title={t("map_fullscreen_title")}
						className="group/frame relative block cursor-zoom-in rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{!loaded && (
							<div className="flex aspect-[844/766] items-center justify-center rounded-lg bg-muted/40">
								<Loader2 className="size-6 animate-spin text-muted-foreground" />
							</div>
						)}
						{/* biome-ignore lint/performance/noImgElement: the frame route already serves an optimised WebP */}
						<img
							src={url}
							alt={definition.description}
							onLoad={() => setLoaded(true)}
							onError={() => setLoaded(true)}
							className={cn("w-full rounded-lg", !loaded && "hidden")}
						/>
						<span className="pointer-events-none absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-xs shadow-sm ring-1 ring-foreground/10 transition-opacity group-hover/frame:opacity-100 sm:opacity-0">
							<ExternalLink className="size-3.5" />
							{t("map_fullscreen")}
						</span>
					</a>

					{/* The map's own legend: four layers share one image, and the grey
					    scale in particular is not readable without it. */}
					<div className="mt-4 space-y-3 text-muted-foreground text-sm">
						{definition.details.paragraphs.map((paragraph) => (
							<p key={paragraph}>{paragraph}</p>
						))}
						{definition.details.bullets && (
							<ul className="list-disc space-y-1 pl-5">
								{definition.details.bullets.map((bullet) => (
									<li key={bullet}>{bullet}</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
