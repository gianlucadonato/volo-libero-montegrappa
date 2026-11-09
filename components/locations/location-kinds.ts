// Shared by the map and its loader. Kept free of Leaflet and of the locations
// data, so the loader can import it without pulling either into its bundle.

export type LocationKind = "takeoff" | "landing";

export const PIN_COLORS: Record<LocationKind, string> = {
	takeoff: "#16a34a",
	landing: "#2563eb",
};

export const KIND_LABELS: Record<LocationKind, string> = {
	takeoff: "Decollo",
	landing: "Atterraggio",
};

export const KIND_LABELS_PLURAL: Record<LocationKind, string> = {
	takeoff: "Decolli",
	landing: "Atterraggi",
};
