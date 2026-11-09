"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/locations/locations-map.css";
import { ArrowRight, Navigation } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
	LayersControl,
	MapContainer,
	Marker,
	Popup,
	TileLayer,
} from "react-leaflet";
import {
	type LocationKind,
	PIN_COLORS,
} from "@/components/locations/location-kinds";
import type { LocationPin } from "@/components/locations/location-pins";
import WindRose from "@/components/locations/WindRose";
import { cn } from "@/lib/utils";

// Arrow up for a take-off, down for a landing, inside a teardrop pin.
const GLYPHS: Record<LocationKind, string> = {
	takeoff: "M16 9.5 21 16h-3.2v5.5h-3.6V16H11z",
	landing: "M16 22.5 11 16h3.2v-5.5h3.6V16H21z",
};

function pinIcon(kind: LocationKind, dimmed: boolean) {
	const color = PIN_COLORS[kind];
	const scale = dimmed ? 0.8 : 1;
	const width = 32 * scale;
	const height = 42 * scale;
	return L.divIcon({
		className: "location-pin",
		html: `<svg width="${width}" height="${height}" viewBox="0 0 32 42" style="opacity:${dimmed ? 0.65 : 1};filter:drop-shadow(0 1px 2px rgb(0 0 0 / .4))">
			<path d="M16 1C7.7 1 1 7.7 1 16c0 10.5 15 25 15 25s15-14.5 15-25C31 7.7 24.3 1 16 1z" fill="${color}" stroke="#fff" stroke-width="2"/>
			<circle cx="16" cy="16" r="9" fill="#fff"/>
			<path d="${GLYPHS[kind]}" fill="${color}"/>
		</svg>`,
		iconSize: [width, height],
		iconAnchor: [width / 2, height],
		popupAnchor: [0, -height + 4],
	});
}

const ICONS = {
	takeoff: { main: pinIcon("takeoff", false), dim: pinIcon("takeoff", true) },
	landing: { main: pinIcon("landing", false), dim: pinIcon("landing", true) },
};

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";

function LocationPopup({ pin }: { pin: LocationPin }) {
	const t = useTranslations("Locations.map");
	const directions = `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;
	return (
		<div className="w-56 text-sm text-slate-700">
			<span
				className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
				style={{ backgroundColor: PIN_COLORS[pin.kind] }}
			>
				{t(`kind.${pin.kind}`)}
			</span>
			<div className="mt-1.5 text-base font-semibold leading-tight text-slate-900">
				{pin.title}
			</div>
			<div className="text-xs text-slate-500">
				{pin.place}
				{pin.altitude && ` · ${pin.altitude}`}
			</div>

			{pin.direction && (
				<div className="mt-3 flex items-center gap-3">
					<WindRose direction={pin.direction} className="size-24 shrink-0" />
					<div>
						<div className="text-[11px] uppercase tracking-wider text-slate-500">
							{t("windDirection")}
						</div>
						<div className="font-medium text-slate-900">
							{pin.directionLabel}
						</div>
					</div>
				</div>
			)}

			<div className="mt-3 flex gap-2">
				<Link
					href={pin.href}
					className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-slate-900 px-2 py-1.5 text-xs font-medium text-white! hover:bg-slate-700"
				>
					{t("details")}
					<ArrowRight className="size-3.5" />
				</Link>
				<a
					href={directions}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium hover:bg-slate-100"
				>
					<Navigation className="size-3.5" />
					{t("directions")}
				</a>
			</div>
		</div>
	);
}

/**
 * Every take-off and landing on one map. The page's own kind (`focus`) is drawn
 * in full and on top; the other kind is dimmed, its "details" link leading to
 * the other page.
 */
export default function LocationsMap({
	pins,
	focus,
	className,
}: {
	pins: LocationPin[];
	focus: LocationKind;
	className?: string;
}) {
	const t = useTranslations("Locations.map.layers");
	const bounds = useMemo(
		() => L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng])),
		[pins],
	);

	return (
		<MapContainer
			bounds={bounds}
			// Pins rise ~42px above their point and the controls sit in the top
			// corners: leave more room at the top so no pin hides under them.
			boundsOptions={{ paddingTopLeft: [50, 80], paddingBottomRight: [50, 20] }}
			// The pins sit a few km apart: fit them closely instead of rounding
			// down to the next whole zoom level.
			zoomSnap={0.25}
			// The map sits in a long page: don't hijack the scroll wheel.
			scrollWheelZoom={false}
			className={cn("locations-map z-0 rounded-xl", className)}
		>
			<LayersControl position="topright">
				<LayersControl.BaseLayer checked name={t("satellite")}>
					<TileLayer
						url={`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`}
						attribution="&copy; Esri"
						maxNativeZoom={17}
						maxZoom={18}
					/>
				</LayersControl.BaseLayer>
				<LayersControl.BaseLayer name={t("topo")}>
					<TileLayer
						url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
						attribution="&copy; OpenTopoMap"
						maxNativeZoom={17}
						maxZoom={18}
					/>
				</LayersControl.BaseLayer>
			</LayersControl>

			{pins.map((pin) => {
				const isFocus = pin.kind === focus;
				return (
					<Marker
						key={`${pin.kind}-${pin.id}`}
						position={[pin.lat, pin.lng]}
						icon={ICONS[pin.kind][isFocus ? "main" : "dim"]}
						zIndexOffset={isFocus ? 1000 : 0}
						title={pin.title}
					>
						{/* Pan the popup clear of the zoom and layer controls. */}
						<Popup
							autoPanPaddingTopLeft={[10, 60]}
							autoPanPaddingBottomRight={[10, 10]}
						>
							<LocationPopup pin={pin} />
						</Popup>
					</Marker>
				);
			})}
		</MapContainer>
	);
}
