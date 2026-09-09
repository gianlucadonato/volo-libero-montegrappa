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

/**
 * How to read a map, transcribed verbatim from the corresponding elmeteo.it
 * page so that pilots read the same wording they are used to. Shown under the
 * image when a quadrant is maximised.
 */
export type ElmeteoMapDetails = {
	/** Red note the source prints above the map, when it has one. */
	warning?: string;
	/** Whether the source repeats the A–G legend of the local sites. */
	sites?: boolean;
	/** Explanatory paragraphs, in source order. */
	paragraphs: readonly string[];
	/** Legend entries describing each layer of the map. */
	bullets?: readonly string[];
};

export type ElmeteoMap = {
	/** File stem inside the run folder, e.g. `term950` for `term950_12.png`. */
	id: string;
	/** Short label for the quadrant header. */
	label: string;
	/** Full caption, matching the one printed in the image. */
	description: string;
	group: ElmeteoMapGroup;
	/** Missing for the maps whose source page has not been transcribed yet. */
	details?: ElmeteoMapDetails;
};

/**
 * Reference points marked A–G on the maps that carry them. Same list on every
 * such map, so it lives here instead of being repeated in each description.
 */
export const elmeteoSiteLegend = [
	"A: 850m circa decollo Rubbio",
	"B: 850m circa decollo Tappeti",
	"C: 1100m circa decollo Col Campeggia",
	"D: 1550m circa decollo Panettone",
	"E: 1500m circa Vedetta",
	"F: 800m circa monte Tomba",
	"G: 180m circa atterraggio Garden Relais",
] as const;

/** Repeated verbatim on both updraft maps, apart from the middle sentence. */
const arrowsBullet =
	"Frecce: in nero sulla mappa indicano la direzione del vento (la punta della freccia indica la direzione verso cui va il vento, mentre il gambo della freccia ne indica la provenienza): più è lunga la freccia, maggiore è la frequenza della raffica.";

const updraftDangerParagraph =
	"E’ molto utile per chi pratica Volo Libero. Valori molto alti possono creare pericolo.";

export const elmeteoMaps = [
	{
		id: "term950",
		label: "Termiche 500-1500 m",
		description: "Intensità delle ascendenze tra 500 e 1500 m",
		group: "termica",
		details: {
			warning:
				"ATTENZIONE: l’Updraft in mappa è totale, per conoscere solo quello “sfruttabile” è necessario consultare le Tabelle sottostanti: se la quota è verde significa che c’è attività termica. Le zone della mappa in rosso con puntini indicano l’impossibilità di sfruttare l’Updraft per vento forte.",
			paragraphs: [
				"Queste mappe mostrano la corrente ascensionale (updraft) media prevista da 500m a 1500m circa. L’updraft si deve considerare totale, cioè comprensivo di tutti i fattori che possono generarlo (riscaldamento del suolo, orografia, vento, cumuli e/o cumulonembi); quando c’è colore azzurro significa che ci sono le condizioni per sfruttare correnti ascensionali (minimo 0,7 m/s), il dato è il valore medio.",
				updraftDangerParagraph,
			],
			bullets: [
				"Updraft da 500m a 1500m circa: è definito dalla scala di colori in basso: valori di colore azzurro solitamente non destano preoccupazioni. L’unità di misura di salita è espressa in metri al secondo (m/s).",
			],
		},
	},
	{
		id: "term850",
		label: "Termiche oltre 1500 m",
		description: "Intensità delle ascendenze sopra i 1500 m",
		group: "termica",
		details: {
			warning:
				"ATTENZIONE: l’Updraft in mappa è totale, per conoscere solo quello “sfruttabile” è necessario consultare le Tabelle. Le zone della mappa in rosso con puntini indicano l’impossibilità di sfruttare l’Updraft per vento forte.",
			paragraphs: [
				"Queste mappe mostrano la corrente ascensionale (updraft) prevista a 850 hPa (circa 1500m). L’updraft si deve considerare totale, cioè comprensivo di tutti i fattori che possono generarlo (riscaldamento del suolo, orografia, vento, cumuli e/o cumulonembi); quando c’è colore azzurro significa che ci sono le condizioni per sfruttare correnti ascensionali (minimo 1 m/s)",
				updraftDangerParagraph,
			],
			bullets: [
				"Updraft a 850 hPa (1500m circa): è definito dalla scala di colori in basso: valori di colore azzurro solitamente non destano preoccupazioni. L’unità di misura di salita è espressa in metri al secondo (m/s).",
				"Geopotenziale a 850 hpa: la lettera H è posta sul punto di maggior geopotenziale con il valore (altezza in metri dove la pressione è di 850 hPa); la lettera L invece identifica il punto di minor geopotenziale.",
			],
		},
	},
	{
		id: "hbas_sc",
		label: "Base delle nuvole",
		description: "Altitudine della base delle nuvole dal livello del mare",
		group: "termica",
		details: {
			warning:
				"Fuori dalla nube se fuori dello strato stabile (se presente) e previsione altezza almeno:",
			sites: true,
			paragraphs: [
				"Queste mappe sono utili per capire a che altezza (in metri) sarà la base della nube. Nella mappa viene raffigurata l’altezza della base dal livello del mare. Molto utili per chi pratica volo libero.",
			],
		},
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
		details: {
			paragraphs: [
				"Queste mappe indicano le turbolenze ( in gergo “vuoti d’aria”) che possono disturbare il volo e rendere le correnti ascensionali termiche non omogenee, fino a “romperle”. Se troppo forti, le turbolenze possono diventare pericolose.",
			],
			bullets: [
				"INDICE DI TURBOLENZA: è definito dalla scala di colori in basso al centro; azzurro = debole, giallo = moderato, rosso = forte. L’indice è il frutto di un complesso calcolo matematico che prende in considerazione il wind shear e lo rapporta ai venti e alle correnti ascensionali termiche. NOSTRA ESCLUSIVA",
			],
		},
	},
	{
		id: "vento10m",
		label: "Vento a 10 m",
		description: "Direzione e velocità media del vento a 10 m",
		group: "vento",
		details: {
			sites: true,
			paragraphs: [
				"Queste mappe mostrano la direzione e la velocità media del vento a 10 metri di altezza dal terreno. Le frecce indicano sia la direzione che la frequenza della raffica: si guarda alla lunghezza della freccia, freccia corta = poche raffiche, freccia lunga = molte raffiche.",
			],
			bullets: [
				"Vento medio: è definito dalla scala di colori in basso al centro e si misura in kilometri orari (km/h); fino a 20 km/h (colori azzurri e verdi) solitamente non desta preoccupazioni, oltre i 20 km/h potrebbe diventare pericoloso.",
				arrowsBullet,
			],
		},
	},
	{
		id: "raff10m",
		label: "Raffiche a 10 m",
		description: "Direzione del vento e raffica massima a 10 m",
		group: "vento",
		details: {
			sites: true,
			paragraphs: [
				"Queste mappe mostrano la direzione e la velocità massima che può raggiungere il vento a 10 metri di altezza dal terreno. La velocità massima è intesa come raffica di vento e potrebbe essere solo un episodio, oppure un susseguirsi di raffiche. Per vedere quanto frequenti possano essere le raffiche si guarda alla lunghezza della freccia, freccia corta = poche raffiche, freccia lunga = molte raffiche.",
			],
			bullets: [
				"Vento raffica: è definito dalla scala di colori in basso al centro e si misura in kilometri orari (km/h); fino a 20 km/h (colori azzurri e verdi) solitamente non desta preoccupazioni, oltre i 20 km/h potrebbe diventare pericoloso.",
				arrowsBullet,
			],
		},
	},
	{
		id: "conv10m",
		label: "Convergenze a 10 m",
		description: "Convergenza dei venti a 10 m",
		group: "vento",
		details: {
			paragraphs: [
				"Queste mappe sono utili per capire se i venti a 10m, provenendo da opposte direzioni, si “scontrano” in uno stesso punto creando così una convergenza che costringe la massa d’aria a sollevamento forzato.",
			],
			bullets: [
				"CONVERGENCE: è definita dalla scala di colori in basso: azzurro = debole, blu = moderato, giallo = forte.",
			],
		},
	},
	{
		id: "vento950",
		label: "Vento a 950 hPa",
		description: "Geopotenziale [m] e venti [km/h] a 950 hPa",
		group: "vento",
		details: {
			paragraphs: [
				"Queste mappe mostrano la direzione e la velocità media del vento a 950 hPa (circa 500/600m) in libera atmosfera (senza ostacoli o interferenze). Le frecce indicano sia la direzione che la frequenza della raffica: si guarda alla lunghezza della freccia, freccia corta = poche raffiche, freccia lunga = molte raffiche.",
			],
			bullets: [
				"Vento medio: è definito dalla scala di colori in basso al centro e si misura in kilometri orari (km/h).",
				arrowsBullet,
			],
		},
	},
	{
		id: "vento850",
		label: "Vento a 850 hPa",
		description: "Geopotenziale [m] e venti [km/h] a 850 hPa",
		group: "vento",
		details: {
			paragraphs: [
				"Queste mappe mostrano la direzione e la velocità media del vento a 850 hPa (circa 1500m) in libera atmosfera (senza ostacoli o interferenze). Le frecce indicano sia la direzione che la frequenza della raffica: si guarda alla lunghezza della freccia, freccia corta = poche raffiche, freccia lunga = molte raffiche.",
			],
			bullets: [
				"Vento medio: è definito dalla scala di colori in basso al centro e si misura in kilometri orari (km/h).",
				arrowsBullet,
			],
		},
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
		details: {
			paragraphs: [
				"Theta-e è un indice che prende in considerazione principalmente temperatura e umidità, in particolare definisce le caratteristiche che riesce a mantenere una particella d’aria che sale di quota. Solitamente viene considerata la quota di 850 hPa (circa 1500 metri) perchè i cumuli e i cumulonembi si formano circa a quella quota. Può essere molto utile per prevedere se ci sarà la formazione di cumuli e se essi possono “degenerare” in cumulonembi (temporale).",
			],
			bullets: [
				"Theta-e a 850 hPa (1500m circa): è definito dalla scala di colori in basso: quando il colore è rosso è probabile la formazione di cumuli, se va dal rosso verso il rosa e il bianco (fine scala a destra) è probabile che i cumuli “degenerino” in cumulonembi e quindi in temporale.",
				"MSLP o PSLM: è la pressione ridotta al livello del mare, si misura in ettopascal e viene segnalata con righe nere. Nel volo libero equivale al QNH.",
			],
		},
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
