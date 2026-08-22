import type { TaskWaypoint } from "@/lib/tsk-parser";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: TaskWaypoint, b: TaskWaypoint): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;

	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lon - a.lon);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

	return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Distance actually flown between two turnpoint cylinders: centre-to-centre
 * distance minus both radii, never negative.
 */
export function legDistanceBetweenBuoysKm(
	prev: TaskWaypoint | undefined,
	curr: TaskWaypoint,
): number {
	if (!prev) return 0;
	const centerDistanceKm = haversineKm(prev, curr);
	const prevRadiusKm = (prev.radiusM || 0) / 1000;
	const currRadiusKm = (curr.radiusM || 0) / 1000;
	return Math.max(0, centerDistanceKm - prevRadiusKm - currRadiusKm);
}
