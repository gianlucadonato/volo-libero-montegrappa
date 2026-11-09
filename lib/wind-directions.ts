// Turns the free-text "Direzione vento" of a take-off ("sud - sud/est -
// sud/ovest", "sud/sud est", …) into the compass sectors it covers, for the
// wind rose on the locations map.

/** The eight sectors of the rose, clockwise from north. */
export const COMPASS_SECTORS = [
	"N",
	"NE",
	"E",
	"SE",
	"S",
	"SW",
	"W",
	"NW",
] as const;

export type CompassSector = (typeof COMPASS_SECTORS)[number];

const POINTS_16 = [
	"N",
	"NNE",
	"NE",
	"ENE",
	"E",
	"ESE",
	"SE",
	"SSE",
	"S",
	"SSW",
	"SW",
	"WSW",
	"W",
	"WNW",
	"NW",
	"NNW",
];

const WORDS = {
	nord: "N",
	sud: "S",
	est: "E",
	ovest: "W",
} as const;

type DirectionWord = keyof typeof WORDS;

/**
 * The directions named by the text, as 16-point abbreviations, in the text's
 * order. Directions are separated by "-"; within one, the words are read in
 * order, so "sud/est" is SE and "sud/sud est" is SSE. A part it cannot read is
 * returned as `null`.
 */
function readDirections(text: string): (string | null)[] {
	return text.split("-").map((part) => {
		const point = (part.toLowerCase().match(/nord|sud|ovest|est/g) ?? [])
			.map((word) => WORDS[word as DirectionWord])
			.join("");
		return POINTS_16.includes(point) ? point : null;
	});
}

/**
 * Sectors of the eight-point rose named by the text, in compass order. A
 * 16-point direction like SSE sits between two sectors and lights both.
 * Unknown words are ignored.
 */
export function parseWindDirections(text: string): CompassSector[] {
	const sectors = new Set<CompassSector>();
	for (const point of readDirections(text)) {
		if (point === null) continue;
		const index = POINTS_16.indexOf(point);
		if (index % 2 === 0) {
			sectors.add(COMPASS_SECTORS[index / 2]);
		} else {
			sectors.add(COMPASS_SECTORS[(index - 1) / 2]);
			sectors.add(COMPASS_SECTORS[((index + 1) / 2) % 8]);
		}
	}
	return COMPASS_SECTORS.filter((sector) => sectors.has(sector));
}

/**
 * The text as international compass abbreviations, the same in every
 * language: "sud - sud/est - sud/ovest" reads "S - SE - SW", "sud/sud est"
 * reads "SSE". A part it cannot read is kept as written.
 */
export function formatWindDirection(text: string): string {
	const parts = text.split("-");
	return readDirections(text)
		.map((point, i) => point ?? parts[i].trim())
		.join(" - ");
}
