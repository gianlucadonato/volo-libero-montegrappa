/**
 * Catalogue of the ElMeteo map types available in the S3 bucket.
 *
 * The labels come from the caption printed inside each image, NOT from the file
 * name: several stems are misleading (`term950` is the 500–1500m updraft,
 * `term850` the one above 1500m, `temp850` is a temperature map while
 * `thetae850` is MSLP + Theta-E).
 *
 * `nubi` is intentionally excluded: it is produced by the source but every
 * frame is a black 5–12 KB placeholder. The equivalent information is in
 * `prec` ("Clouds, rain, snow and MSLP").
 */

export type ElmeteoMapGroup = "termica" | "vento" | "precipitazioni" | "quota";

export type ElmeteoMap = {
	/** File stem inside the run folder, e.g. `term950` for `term950_12.png`. */
	id: string;
	/** Short label for the quadrant header. */
	label: string;
	/** Full caption, matching the one printed in the image. */
	description: string;
	group: ElmeteoMapGroup;
};

export const elmeteoMaps = [
	{
		id: "term950",
		label: "Termiche 500-1500 m",
		description: "Intensità delle ascendenze tra 500 e 1500 m",
		group: "termica",
	},
	{
		id: "term850",
		label: "Termiche oltre 1500 m",
		description: "Intensità delle ascendenze sopra i 1500 m",
		group: "termica",
	},
	{
		id: "hbas_sc",
		label: "Base delle nuvole",
		description: "Altitudine della base delle nuvole dal livello del mare",
		group: "termica",
	},
	{
		id: "capecin",
		label: "CAPE e CIN",
		description:
			"CAPE e CIN (dove ci sono i punti prevale l'inibizione), direzione delle nubi",
		group: "termica",
	},
	{
		id: "turb",
		label: "Turbolenza",
		description: "Turbolenza prevista, da molto debole a molto forte",
		group: "termica",
	},
	{
		id: "vento10m",
		label: "Vento a 10 m",
		description: "Direzione e velocità media del vento a 10 m",
		group: "vento",
	},
	{
		id: "raff10m",
		label: "Raffiche a 10 m",
		description: "Direzione del vento e raffica massima a 10 m",
		group: "vento",
	},
	{
		id: "conv10m",
		label: "Convergenze a 10 m",
		description: "Convergenza dei venti a 10 m",
		group: "vento",
	},
	{
		id: "vento950",
		label: "Vento a 950 hPa",
		description: "Geopotenziale [m] e venti [km/h] a 950 hPa",
		group: "vento",
	},
	{
		id: "vento850",
		label: "Vento a 850 hPa",
		description: "Geopotenziale [m] e venti [km/h] a 850 hPa",
		group: "vento",
	},
	{
		id: "prec",
		label: "Nuvole e precipitazioni",
		description: "Nuvole, pioggia, neve e pressione al livello del mare",
		group: "precipitazioni",
	},
	{
		id: "precip_acc",
		label: "Precipitazioni cumulate",
		description: "Precipitazioni accumulate dall'inizio del run",
		group: "precipitazioni",
	},
	{
		id: "hsnow",
		label: "Neve",
		description:
			"Variazione dello spessore della neve [cm] dall'inizio del run e quota neve [m]",
		group: "precipitazioni",
	},
	{
		id: "t_2m",
		label: "Temperatura a 2 m",
		description: "Temperatura dell'aria a 2 m dal suolo",
		group: "quota",
	},
	{
		id: "temp850",
		label: "Temperatura a 850 hPa",
		description: "Geopotenziale [m] e temperatura [°C] a 850 hPa",
		group: "quota",
	},
	{
		id: "thetae850",
		label: "MSLP e Theta-E",
		description: "Pressione al livello del mare [hPa] e THETA_E [°C] a 850 hPa",
		group: "quota",
	},
] as const satisfies readonly ElmeteoMap[];

export type ElmeteoMapId = (typeof elmeteoMaps)[number]["id"];

export const elmeteoMapGroupLabels: Record<ElmeteoMapGroup, string> = {
	termica: "Termica",
	vento: "Vento",
	precipitazioni: "Precipitazioni",
	quota: "Quota e temperatura",
};

const mapsById = new Map<string, ElmeteoMap>(
	elmeteoMaps.map((map) => [map.id, map]),
);

export function isElmeteoMapId(value: string): value is ElmeteoMapId {
	return mapsById.has(value);
}

export function getElmeteoMap(id: ElmeteoMapId) {
	// Safe: the id type is derived from the catalogue itself.
	return mapsById.get(id) as ElmeteoMap;
}

/** Default map shown in each of the six quadrants on a first visit. */
export const defaultQuadrantMaps = [
	"term950",
	"term850",
	"hbas_sc",
	"vento10m",
	"raff10m",
	"prec",
] as const satisfies readonly ElmeteoMapId[];

export const quadrantCount = defaultQuadrantMaps.length;
