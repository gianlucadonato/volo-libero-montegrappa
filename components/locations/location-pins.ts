import type { LocationType } from "@/components/LocationCard";
import type { LocationKind } from "@/components/locations/location-kinds";
import { LANDINGS } from "@/config/landings";
import { TAKEOFFS } from "@/config/takeoffs";

/** What the map needs of a location: plain data, safe to pass to the client. */
export type LocationPin = {
	id: string;
	kind: LocationKind;
	/** Translated: "Decollo Tappeti", "Tappeti take-off". */
	title: string;
	place: string;
	altitude?: string;
	/** "Direzione vento" in Italian, read by the wind rose. */
	direction?: string;
	/** The same direction, translated for display. */
	directionLabel?: string;
	lat: number;
	lng: number;
	/** The location's card: `/decolli#tappeti`, `/atterraggi#garden`. */
	href: string;
};

/** The texts a pin needs in the reader's language. */
export type PinLabels = {
	title: (kind: LocationKind, name: string) => string;
	direction: (text: string) => string;
};

const PAGES: Record<LocationKind, string> = {
	takeoff: "/decolli",
	landing: "/atterraggi",
};

function toPin(
	location: LocationType,
	kind: LocationKind,
	labels: PinLabels,
): LocationPin | null {
	const [lat, lng] = location.table.gps.split(",").map(Number);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	const { direction } = location.table;
	return {
		id: location.id,
		kind,
		title: labels.title(kind, location.name),
		place: location.table.location,
		altitude: location.table.altitude,
		direction,
		directionLabel: direction && labels.direction(direction),
		lat,
		lng,
		href: `${PAGES[kind]}#${location.id}`,
	};
}

/** Every take-off and landing, for the map on both pages. */
export function allLocationPins(labels: PinLabels): LocationPin[] {
	return [
		...TAKEOFFS.map((location) => toPin(location, "takeoff", labels)),
		...LANDINGS.map((location) => toPin(location, "landing", labels)),
	].filter((pin): pin is LocationPin => pin !== null);
}
