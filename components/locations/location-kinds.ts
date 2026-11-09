// Shared by the map and its loader. Kept free of Leaflet and of the locations
// data, so the loader can import it without pulling either into its bundle.

export type LocationKind = "takeoff" | "landing";

export const PIN_COLORS: Record<LocationKind, string> = {
	takeoff: "#16a34a",
	landing: "#2563eb",
};
