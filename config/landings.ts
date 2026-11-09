import type { LocationType } from "@/components/LocationCard";
import { PUBLIC_MEDIA_BASE_URL } from "@/config/constants";

// Landings of the Monte Grappa flying area, shown as cards on /atterraggi and as
// pins on the locations map. Only language-neutral data lives here: the texts
// are in messages/*.json under Locations.landings.<id>.
export const LANDINGS: LocationType[] = [
	{
		id: "garden",
		name: "Garden Relais",
		area: "Semonzo del Grappa - TV",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/atterraggi-garden-vento-sud-est-ovest.jpg`,
		table: {
			location: "Semonzo",
			altitude: "130 m",
			gps: "45.80653, 11.78532",
			food: true,
			toilets: true,
			parking: true,
		},
	},
	{
		id: "paradiso",
		name: "Paradiso",
		area: "Semonzo del Grappa - TV",
		image: `${PUBLIC_MEDIA_BASE_URL}/locations/atterraggi-paradiso-vento-sud-est-ovest.jpg`,
		table: {
			location: "Semonzo del Grappa",
			altitude: "190 m",
			gps: "45.80818, 11.7699",
			food: "100 m",
			toilets: true,
			parking: true,
		},
	},
];
