"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef } from "react";
import {
	Circle,
	MapContainer,
	Marker,
	Polyline,
	TileLayer,
	useMap,
} from "react-leaflet";
import type { TaskWaypoint } from "@/lib/tsk-parser";

// Fix leaflet default icon paths broken by webpack/Next.js bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
	._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function AutoFit({ waypoints }: { waypoints: TaskWaypoint[] }) {
	const map = useMap();
	const fitted = useRef(false);

	useEffect(() => {
		if (fitted.current || waypoints.length === 0) return;
		const bounds = L.latLngBounds(waypoints.map((wp) => [wp.lat, wp.lon]));
		map.fitBounds(bounds, { padding: [50, 50] });
		fitted.current = true;
	}, [map, waypoints]);

	return null;
}

const WP_COLORS: Record<string, string> = {
	takeoff: "#f39c12",
	sss: "#2ecc71",
	ess: "#3498db",
	goal: "#e74c3c",
	turnpoint: "#9b59b6",
};

function waypointColor(wp: TaskWaypoint): string {
	return WP_COLORS[wp.type] ?? WP_COLORS.turnpoint;
}

function waypointLabel(wp: TaskWaypoint, index: number): string {
	if (wp.type === "takeoff") return "T/O";
	if (wp.type === "goal") return "GOAL";
	if (wp.type === "sss") return "SSS";
	if (wp.type === "ess") return "ESS";
	return String(index);
}

interface XcTaskMapProps {
	waypoints: TaskWaypoint[];
	className?: string;
}

export default function XcTaskMap({ waypoints, className }: XcTaskMapProps) {
	if (waypoints.length === 0) {
		return (
			<div
				className={`flex items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground ${className ?? "h-120"}`}
			>
				Nessun waypoint disponibile
			</div>
		);
	}

	const center: [number, number] = [waypoints[0].lat, waypoints[0].lon];

	// Route polyline: center of each cylinder in order
	const routeLine: [number, number][] = waypoints.map((wp) => [wp.lat, wp.lon]);

	// Create numbered div icons for waypoints
	const createWpIcon = (wp: TaskWaypoint, index: number) => {
		const color = waypointColor(wp);
		const label = waypointLabel(wp, index + 1);
		return L.divIcon({
			html: `<div style="
        background:${color};
        color:#fff;
        border:2px solid #fff;
        border-radius:50%;
        width:28px;height:28px;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
        font-family:sans-serif;
      ">${label}</div>`,
			className: "",
			iconSize: [28, 28],
			iconAnchor: [14, 14],
		});
	};

	return (
		<div
			className={`overflow-hidden rounded-xl border border-border ${className ?? "h-120"}`}
		>
			<MapContainer
				center={center}
				zoom={10}
				style={{ height: "100%", width: "100%" }}
				zoomControl
			>
				<TileLayer
					url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
					attribution="&copy; Esri World Imagery"
				/>

				<AutoFit waypoints={waypoints} />

				{/* Route line */}
				<Polyline
					positions={routeLine}
					pathOptions={{
						color: "#00ffff",
						weight: 2.5,
						opacity: 0.75,
						dashArray: "6 4",
					}}
				/>

				{/* Cylinders + markers */}
				{waypoints.map((wp, idx) => {
					const color = waypointColor(wp);
					return (
						<React.Fragment key={idx}>
							<Circle
								center={[wp.lat, wp.lon]}
								radius={wp.radiusM}
								pathOptions={{
									color,
									fillColor: color,
									fillOpacity: 0.12,
									weight: 2,
								}}
							/>
							<Marker
								position={[wp.lat, wp.lon]}
								icon={createWpIcon(wp, idx)}
							/>
						</React.Fragment>
					);
				})}
			</MapContainer>
		</div>
	);
}
