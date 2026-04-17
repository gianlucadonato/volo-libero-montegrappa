"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef } from "react";
import {
	Circle,
	CircleMarker,
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

function FocusSelectedWaypoint({
	waypoints,
	selectedWaypointIndex,
}: {
	waypoints: TaskWaypoint[];
	selectedWaypointIndex?: number | null;
}) {
	const map = useMap();

	useEffect(() => {
		if (
			selectedWaypointIndex === null ||
			selectedWaypointIndex === undefined ||
			selectedWaypointIndex < 0 ||
			selectedWaypointIndex >= waypoints.length
		) {
			return;
		}

		const wp = waypoints[selectedWaypointIndex];
		const targetZoom = Math.max(map.getZoom(), 11);
		map.flyTo([wp.lat, wp.lon], targetZoom, { duration: 0.5 });
	}, [map, selectedWaypointIndex, waypoints]);

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
	selectedWaypointIndex?: number | null;
	trackCoordinates?: [number, number][];
	hoveredTrackPosition?: [number, number] | null;
}

export default function XcTaskMap({
	waypoints,
	className,
	selectedWaypointIndex,
	trackCoordinates,
	hoveredTrackPosition,
}: XcTaskMapProps) {
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

	// Route polyline: points on cylinder boundaries (touching buoy radius)
	const buildCircleTouchingRoute = (
		items: TaskWaypoint[],
	): [number, number][] => {
		if (items.length < 2) return items.map((wp) => [wp.lat, wp.lon]);

		const avgLat =
			items.reduce((sum, wp) => sum + wp.lat, 0) / Math.max(items.length, 1);
		const avgLon =
			items.reduce((sum, wp) => sum + wp.lon, 0) / Math.max(items.length, 1);

		const metersPerLat = 111_320;
		const metersPerLon = 111_320 * Math.cos((avgLat * Math.PI) / 180);

		const toXY = (lat: number, lon: number) => ({
			x: (lon - avgLon) * metersPerLon,
			y: (lat - avgLat) * metersPerLat,
		});

		const toLatLon = (x: number, y: number): [number, number] => [
			avgLat + y / metersPerLat,
			avgLon + x / metersPerLon,
		];

		const circles = items.map((wp) => {
			const c = toXY(wp.lat, wp.lon);
			return { c, r: Math.max(0, wp.radiusM || 0) };
		});

		const distance = (
			a: { x: number; y: number },
			b: { x: number; y: number },
		) => Math.hypot(a.x - b.x, a.y - b.y);

		const onCircle = (
			centerPoint: { x: number; y: number },
			radius: number,
			theta: number,
		) => ({
			x: centerPoint.x + radius * Math.cos(theta),
			y: centerPoint.y + radius * Math.sin(theta),
		});

		const closestOnCircleToward = (
			circle: { c: { x: number; y: number }; r: number },
			target: { x: number; y: number },
		) => {
			if (circle.r <= 0) return { ...circle.c };
			const vx = target.x - circle.c.x;
			const vy = target.y - circle.c.y;
			const n = Math.hypot(vx, vy) || 1;
			return {
				x: circle.c.x + (circle.r * vx) / n,
				y: circle.c.y + (circle.r * vy) / n,
			};
		};

		const routePoints = circles.map((circle, i) => {
			const target =
				i < circles.length - 1 ? circles[i + 1].c : circles[i - 1].c;
			return closestOnCircleToward(circle, target);
		});

		for (let iter = 0; iter < 8; iter++) {
			for (let i = 0; i < circles.length; i++) {
				const circle = circles[i];
				if (circle.r <= 0) {
					routePoints[i] = { ...circle.c };
					continue;
				}

				if (i === 0) {
					routePoints[i] = closestOnCircleToward(circle, routePoints[i + 1]);
					continue;
				}

				if (i === circles.length - 1) {
					routePoints[i] = closestOnCircleToward(circle, routePoints[i - 1]);
					continue;
				}

				const prev = routePoints[i - 1];
				const next = routePoints[i + 1];

				let bestTheta = 0;
				let bestCost = Number.POSITIVE_INFINITY;

				for (let s = 0; s < 72; s++) {
					const theta = (2 * Math.PI * s) / 72;
					const q = onCircle(circle.c, circle.r, theta);
					const cost = distance(prev, q) + distance(q, next);
					if (cost < bestCost) {
						bestCost = cost;
						bestTheta = theta;
					}
				}

				routePoints[i] = onCircle(circle.c, circle.r, bestTheta);
			}
		}

		return routePoints.map((p) => toLatLon(p.x, p.y));
	};

	const routeLine: [number, number][] = buildCircleTouchingRoute(waypoints);

	// Create numbered div icons for waypoints
	const createWpIcon = (
		wp: TaskWaypoint,
		index: number,
		isSelected: boolean,
	) => {
		const color = waypointColor(wp);
		const label = waypointLabel(wp, index + 1);
		const size = isSelected ? 34 : 28;
		const borderWidth = isSelected ? 3 : 2;
		const fontSize = isSelected ? 12 : 11;
		const iconAnchor = size / 2;
		return L.divIcon({
			html: `<div style="
        background:${color};
        color:#fff;
        border:${borderWidth}px solid #fff;
        border-radius:50%;
        width:${size}px;height:${size}px;
        display:flex;align-items:center;justify-content:center;
        font-size:${fontSize}px;font-weight:700;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
        font-family:sans-serif;
      ">${label}</div>`,
			className: "",
			iconSize: [size, size],
			iconAnchor: [iconAnchor, iconAnchor],
		});
	};

	return (
		<div
			className={`overflow-hidden rounded-xl border border-border ${className ?? "h-120"}`}
		>
			<MapContainer
				center={center}
				zoom={10}
				minZoom={7}
				maxZoom={14}
				className="relative z-0"
				style={{ height: "100%", width: "100%" }}
				zoomControl
			>
				<TileLayer
					url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
					attribution="&copy; Esri World Imagery"
				/>

				<AutoFit waypoints={waypoints} />
				<FocusSelectedWaypoint
					waypoints={waypoints}
					selectedWaypointIndex={selectedWaypointIndex}
				/>

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

				{/* IGC flight track */}
				{trackCoordinates && trackCoordinates.length > 0 && (
					<Polyline
						positions={trackCoordinates}
						pathOptions={{
							color: "#ff4444",
							weight: 2.5,
							opacity: 0.85,
						}}
					/>
				)}

				{/* Hovered position marker */}
				{hoveredTrackPosition && (
					<CircleMarker
						center={hoveredTrackPosition}
						radius={6}
						pathOptions={{
							color: "#ffffff",
							fillColor: "#ff4444",
							fillOpacity: 1,
							weight: 2,
						}}
					/>
				)}

				{/* Cylinders + markers */}
				{waypoints.map((wp, idx) => {
					const color = waypointColor(wp);
					const isSelected = idx === selectedWaypointIndex;
					return (
						<React.Fragment key={idx}>
							<Circle
								center={[wp.lat, wp.lon]}
								radius={wp.radiusM}
								pathOptions={{
									color: isSelected ? "#22d3ee" : color,
									fillColor: color,
									fillOpacity: isSelected ? 0.22 : 0.12,
									weight: isSelected ? 4 : 2,
								}}
							/>
							<Marker
								position={[wp.lat, wp.lon]}
								icon={createWpIcon(wp, idx, isSelected)}
							/>
						</React.Fragment>
					);
				})}
			</MapContainer>
		</div>
	);
}
