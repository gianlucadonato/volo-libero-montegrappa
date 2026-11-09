import type { LocationType } from "@/components/LocationCard";
import type { LocationKind } from "@/components/locations/location-kinds";
import { LANDINGS } from "@/config/landings";
import { TAKEOFFS } from "@/config/takeoffs";

/** What the map needs of a location: plain data, safe to pass to the client. */
export type LocationPin = {
	id: string;
	kind: LocationKind;
	title: string;
	place: string;
	altitude?: string;
	direction?: string;
	lat: number;
	lng: number;
	/** The location's card: `/decolli#tappeti`, `/atterraggi#garden`. */
	href: string;
};

const PAGES: Record<LocationKind, string> = {
	takeoff: "/decolli",
	landing: "/atterraggi",
};

function toPin(location: LocationType, kind: LocationKind): LocationPin | null {
	const [lat, lng] = location.table.gps.split(",").map(Number);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	return {
		id: location.id,
		kind,
		title: location.title,
		place: location.table.location,
		altitude: location.table.altitude,
		direction: location.table.direction,
		lat,
		lng,
		href: `${PAGES[kind]}#${location.id}`,
	};
}

/** Every take-off and landing, for the map on both pages. */
export function allLocationPins(): LocationPin[] {
	return [
		...TAKEOFFS.map((location) => toPin(location, "takeoff")),
		...LANDINGS.map((location) => toPin(location, "landing")),
	].filter((pin): pin is LocationPin => pin !== null);
}
