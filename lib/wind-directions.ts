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

/** Italian labels, for text and accessibility. */
export const SECTOR_LABELS: Record<CompassSector, string> = {
	N: "nord",
	NE: "nord-est",
	E: "est",
	SE: "sud-est",
	S: "sud",
	SW: "sud-ovest",
	W: "ovest",
	NW: "nord-ovest",
};

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

const WORDS: Record<string, string> = {
	nord: "N",
	sud: "S",
	est: "E",
	ovest: "W",
};

/**
 * Sectors of the eight-point rose named by the text, in compass order.
 * Directions are separated by "-"; within one, the words are read in order, so
 * "sud/est" is SE and "sud/sud est" is SSE. A 16-point direction like SSE sits
 * between two sectors and lights both. Unknown words are ignored.
 */
export function parseWindDirections(text: string): CompassSector[] {
	const sectors = new Set<CompassSector>();
	for (const part of text.toLowerCase().split("-")) {
		const point = (part.match(/nord|sud|ovest|est/g) ?? [])
			.map((word) => WORDS[word])
			.join("");
		const index = POINTS_16.indexOf(point);
		if (index === -1) continue;
		if (index % 2 === 0) {
			sectors.add(COMPASS_SECTORS[index / 2]);
		} else {
			sectors.add(COMPASS_SECTORS[(index - 1) / 2]);
			sectors.add(COMPASS_SECTORS[((index + 1) / 2) % 8]);
		}
	}
	return COMPASS_SECTORS.filter((sector) => sectors.has(sector));
}
