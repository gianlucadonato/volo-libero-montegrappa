"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
	type LocationKind,
	PIN_COLORS,
} from "@/components/locations/location-kinds";
import type { LocationPin } from "@/components/locations/location-pins";

const MAP_HEIGHT = "h-[55vh] min-h-80 max-h-140";

// Leaflet needs `window`: render the map on the client only.
const LocationsMap = dynamic(
	() => import("@/components/locations/LocationsMap"),
	{
		ssr: false,
		loading: () => (
			<div
				className={`${MAP_HEIGHT} w-full animate-pulse rounded-xl bg-muted`}
			/>
		),
	},
);

const LEGEND: LocationKind[] = ["takeoff", "landing"];

export default function LocationsMapLoader({
	pins,
	focus,
}: {
	pins: LocationPin[];
	focus: LocationKind;
}) {
	const t = useTranslations("Locations.map");
	return (
		<div>
			<LocationsMap pins={pins} focus={focus} className={MAP_HEIGHT} />
			<div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
				{LEGEND.map((kind) => (
					<span key={kind} className="inline-flex items-center gap-1.5">
						<span
							className="size-3 rounded-full"
							style={{ backgroundColor: PIN_COLORS[kind] }}
						/>
						{t(`legend.${kind}`)}
					</span>
				))}
				<span>{t("hint")}</span>
			</div>
		</div>
	);
}
