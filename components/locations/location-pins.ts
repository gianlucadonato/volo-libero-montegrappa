import type { LocationType } from "@/components/LocationCard";
import type { LocationKind } from "@/components/locations/location-kinds";
import { LANDINGS } from "@/config/landings";
import { TAKEOFFS } from "@/config/takeoffs";
import { formatWindDirection } from "@/lib/wind-directions";

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
	/** The same direction as compass abbreviations: "S - SE - SW". */
	directionLabel?: string;
	lat: number;
	lng: number;
	/** The location's card: `/decolli#tappeti`, `/atterraggi#garden`. */
	href: string;
};

/** A location's title in the reader's language: "Tappeti take-off". */
export type PinTitle = (kind: LocationKind, name: string) => string;

const PAGES: Record<LocationKind, string> = {
	takeoff: "/decolli",
	landing: "/atterraggi",
};

function toPin(
	location: LocationType,
	kind: LocationKind,
	title: PinTitle,
): LocationPin | null {
	const [lat, lng] = location.table.gps.split(",").map(Number);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	const { direction } = location.table;
	return {
		id: location.id,
		kind,
		title: title(kind, location.name),
		place: location.table.location,
		altitude: location.table.altitude,
		direction,
		directionLabel: direction && formatWindDirection(direction),
		lat,
		lng,
		href: `${PAGES[kind]}#${location.id}`,
	};
}

/** Every take-off and landing, for the map on both pages. */
export function allLocationPins(title: PinTitle): LocationPin[] {
	return [
		...TAKEOFFS.map((location) => toPin(location, "takeoff", title)),
		...LANDINGS.map((location) => toPin(location, "landing", title)),
	].filter((pin): pin is LocationPin => pin !== null);
}
