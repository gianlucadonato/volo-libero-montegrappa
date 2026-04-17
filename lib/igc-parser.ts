/**
 * IGC flight log parser.
 * Inspired by https://github.com/Turbo87/igc-parser (MIT License).
 *
 * Parses IGC files and extracts header info, GPS fixes, and computed
 * flight statistics (duration, distance, max altitude, etc.).
 */

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

const RE_HFDTE = /^HFDTE(?:DATE:)?(\d{2})(\d{2})(\d{2})(?:,?(\d{2}))?/;
const RE_PLT_HEADER = /^H(\w)PLT(?:.{0,}?:(.*)|(.*))$/;
const RE_GTY_HEADER = /^H(\w)GTY(?:.{0,}?:(.*)|(.*))$/;
const RE_GID_HEADER = /^H(\w)GID(?:.{0,}?:(.*)|(.*))$/;
const RE_SIT_HEADER = /^H(\w)SIT(?:.{0,}?:(.*)|(.*))$/;
const RE_B =
	/^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})([NS])(\d{3})(\d{2})(\d{3})([EW])([AV])(-\d{4}|\d{5})(-\d{4}|\d{5})/;
const RE_IJ = /^[IJ](\d{2})(?:\d{2}\d{2}[A-Z]{3})+/;
const RE_INT = /^\d*$/;

export interface IGCFix {
	timestamp: number;
	time: string;
	latitude: number;
	longitude: number;
	valid: boolean;
	pressureAltitude: number | null;
	gpsAltitude: number | null;
}

export interface IGCHeader {
	date: string | null;
	pilot: string | null;
	gliderType: string | null;
	registration: string | null;
	site: string | null;
}

export interface IGCFlightStats {
	/** Total flight duration in seconds */
	durationSeconds: number;
	/** Formatted duration HH:MM:SS */
	duration: string;
	/** Max GPS altitude in meters */
	maxAltitude: number;
	/** Min GPS altitude in meters */
	minAltitude: number;
	/** Total distance covered in km (sum of fix-to-fix segments) */
	totalDistanceKm: number;
	/** Start time (first fix) */
	startTime: string | null;
	/** End time (last fix) */
	endTime: string | null;
	/** Number of valid GPS fixes */
	fixCount: number;
}

export interface ParsedIGC {
	header: IGCHeader;
	fixes: IGCFix[];
	stats: IGCFlightStats;
}

interface RecordExtension {
	code: string;
	start: number;
	length: number;
}

function parseLatitude(
	dd: string,
	mm: string,
	mmm: string,
	ns: string,
): number {
	const degrees = parseInt(dd, 10) + parseFloat(`${mm}.${mmm}`) / 60;
	return ns === "S" ? -degrees : degrees;
}

function parseLongitude(
	ddd: string,
	mm: string,
	mmm: string,
	ew: string,
): number {
	const degrees = parseInt(ddd, 10) + parseFloat(`${mm}.${mmm}`) / 60;
	return ew === "W" ? -degrees : degrees;
}

function parseTextHeader(regex: RegExp, line: string): string {
	const match = line.match(regex);
	if (!match) return "";
	return (match[2] || match[3] || "").replace(/_/g, " ").trim();
}

function haversineKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const R = 6371;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function computeStats(fixes: IGCFix[]): IGCFlightStats {
	if (fixes.length === 0) {
		return {
			durationSeconds: 0,
			duration: "00:00:00",
			maxAltitude: 0,
			minAltitude: 0,
			totalDistanceKm: 0,
			startTime: null,
			endTime: null,
			fixCount: 0,
		};
	}

	const validFixes = fixes.filter((f) => f.valid);
	let maxAlt = -Infinity;
	let minAlt = Infinity;
	let totalDist = 0;

	for (let i = 0; i < validFixes.length; i++) {
		const alt =
			validFixes[i].gpsAltitude ?? validFixes[i].pressureAltitude ?? 0;
		if (alt > maxAlt) maxAlt = alt;
		if (alt < minAlt) minAlt = alt;

		if (i > 0) {
			totalDist += haversineKm(
				validFixes[i - 1].latitude,
				validFixes[i - 1].longitude,
				validFixes[i].latitude,
				validFixes[i].longitude,
			);
		}
	}

	const first = validFixes[0];
	const last = validFixes[validFixes.length - 1];
	const durationSeconds = (last.timestamp - first.timestamp) / 1000;

	return {
		durationSeconds,
		duration: formatDuration(durationSeconds),
		maxAltitude: maxAlt === -Infinity ? 0 : maxAlt,
		minAltitude: minAlt === Infinity ? 0 : minAlt,
		totalDistanceKm: Math.round(totalDist * 100) / 100,
		startTime: first.time,
		endTime: last.time,
		fixCount: validFixes.length,
	};
}

export function parseIGC(content: string): ParsedIGC {
	const header: IGCHeader = {
		date: null,
		pilot: null,
		gliderType: null,
		registration: null,
		site: null,
	};

	const fixes: IGCFix[] = [];
	let fixExtensions: RecordExtension[] = [];
	let prevTimestamp: number | null = null;

	for (const rawLine of content.split("\n")) {
		const line = rawLine.trim();
		if (line.length === 0) continue;

		const recordType = line[0];

		if (recordType === "H") {
			const headerType = line.slice(2, 5);
			if (headerType === "DTE") {
				const match = line.match(RE_HFDTE);
				if (match) {
					const lastCentury = match[3][0] === "8" || match[3][0] === "9";
					header.date = `${lastCentury ? "19" : "20"}${match[3]}-${match[2]}-${match[1]}`;
				}
			} else if (headerType === "PLT") {
				header.pilot = parseTextHeader(RE_PLT_HEADER, line);
			} else if (headerType === "GTY") {
				header.gliderType = parseTextHeader(RE_GTY_HEADER, line);
			} else if (headerType === "GID") {
				header.registration = parseTextHeader(RE_GID_HEADER, line);
			} else if (headerType === "SIT") {
				header.site = parseTextHeader(RE_SIT_HEADER, line);
			}
		} else if (recordType === "I") {
			const match = line.match(RE_IJ);
			if (match) {
				const num = parseInt(match[1], 10);
				fixExtensions = [];
				for (let i = 0; i < num; i++) {
					const offset = 3 + i * 7;
					const start = parseInt(line.slice(offset, offset + 2), 10) - 1;
					const end = parseInt(line.slice(offset + 2, offset + 4), 10) - 1;
					fixExtensions.push({
						start,
						length: end - start + 1,
						code: line.slice(offset + 4, offset + 7),
					});
				}
			}
		} else if (recordType === "B" && header.date) {
			const match = line.match(RE_B);
			if (!match) continue;

			const extensions: Record<string, string> = {};
			for (const ext of fixExtensions) {
				extensions[ext.code] = line.slice(ext.start, ext.start + ext.length);
			}

			const time = `${match[1]}:${match[2]}:${match[3]}`;
			let timestamp = Date.parse(`${header.date}T${time}Z`);

			// handle day rollover
			while (prevTimestamp && timestamp < prevTimestamp - ONE_HOUR) {
				timestamp += ONE_DAY;
			}
			prevTimestamp = timestamp;

			const ladExt = RE_INT.test(extensions.LAD ?? "")
				? (extensions.LAD ?? "")
				: "";
			const lodExt = RE_INT.test(extensions.LOD ?? "")
				? (extensions.LOD ?? "")
				: "";

			fixes.push({
				timestamp,
				time,
				latitude: parseLatitude(
					match[4],
					match[5],
					match[6] + ladExt,
					match[7],
				),
				longitude: parseLongitude(
					match[8],
					match[9],
					match[10] + lodExt,
					match[11],
				),
				valid: match[12] === "A",
				pressureAltitude:
					match[13] === "00000" ? null : parseInt(match[13], 10),
				gpsAltitude: match[14] === "00000" ? null : parseInt(match[14], 10),
			});
		}
	}

	return {
		header,
		fixes,
		stats: computeStats(fixes),
	};
}
