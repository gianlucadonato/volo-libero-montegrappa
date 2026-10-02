import L from "leaflet";

export const MARKER_SIZE = 44;

export const TRAIL_COLORS = [
	"#2563eb",
	"#16a34a",
	"#d97706",
	"#dc2626",
	"#7c3aed",
	"#0891b2",
	"#ca8a04",
	"#be185d",
	"#047857",
	"#b45309",
];

export function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// Paraglider wing seen from above (about 8:1), drawn in a 220x56 box.
const WING =
	"M46 39 Q60 18 110 14 Q160 18 174 39 Q176 42 172 43 Q150 40 110 38 Q70 40 48 43 Q44 42 46 39 Z";
const CELLS = [
	[60, 40, 60, 30],
	[72, 39, 72, 23],
	[85, 38, 85, 18],
	[97, 38, 97, 15],
	[110, 38, 110, 14],
	[123, 38, 123, 15],
	[135, 38, 135, 18],
	[148, 39, 148, 23],
	[160, 40, 160, 30],
]
	.map(
		([x1, y1, x2, y2]) =>
			`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0f172a" stroke-width="0.9" opacity="0.4"/>`,
	)
	.join("");

function labelText(y: number, size: number, text: string) {
	return `<text x="22" y="${y}" text-anchor="middle" font-size="${size}" font-weight="800" fill="#fff" stroke="#000" stroke-width="2.5" paint-order="stroke">${escapeHtml(text)}</text>`;
}

// The wing, rotated to the heading and painted in the pilot's colour, with one
// or two lines of label under it, and a pulsing SOS badge on a pilot in
// distress so they stay flagged while they move.
export function aircraftIcon({
	color,
	heading,
	lines,
	sosLabel,
}: {
	color: string;
	heading: number;
	lines: [string, string | null];
	sosLabel: string | null;
}) {
	const [line1, line2] = lines;
	const wing = `<g transform="rotate(${heading},22,22)"><g transform="translate(22,22) scale(0.32) translate(-110,-28)"><path d="${WING}" fill="#000" opacity="0.18" transform="translate(0,3)"/><path d="${WING}" fill="${color}" stroke="#0f172a" stroke-width="1.6" stroke-linejoin="round"/>${CELLS}</g></g>`;
	const text = labelText(37, 9, line1) + (line2 ? labelText(47, 8, line2) : "");
	const sos = sosLabel
		? `<div class="live-map-sos-badge">${escapeHtml(sosLabel)}</div>`
		: "";
	return L.divIcon({
		html: `<div style="position:relative;width:${MARKER_SIZE}px;height:${MARKER_SIZE}px"><svg width="${MARKER_SIZE}" height="${MARKER_SIZE}" viewBox="0 0 44 44" style="overflow:visible">${wing}${text}</svg>${sos}</div>`,
		iconSize: [MARKER_SIZE, MARKER_SIZE],
		iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
		className: "",
	});
}

export function sosIcon(label: string) {
	return L.divIcon({
		className: "",
		iconSize: [34, 34],
		iconAnchor: [17, 17],
		html: `<div class="live-map-sos-marker">${escapeHtml(label)}</div>`,
	});
}

// Map label: a short callsign on one line, otherwise first name and surname on
// two.
export function markerLines(
	label: string,
	name: string | null,
): [string, string | null] {
	if (name) {
		const [first, ...rest] = name.trim().split(/\s+/);
		return [first || label, rest.join(" ") || null];
	}
	return [label, null];
}
