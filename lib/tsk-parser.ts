export type TurnpointType = "takeoff" | "turnpoint" | "goal" | "sss" | "ess";

export interface TaskWaypoint {
	id?: string;
	name: string;
	lat: number;
	lon: number;
	altM: number;
	radiusM: number;
	type: TurnpointType;
	mode: string;
	open?: string;
	close?: string;
}

export interface ParsedTask {
	date?: string;
	taskType?: string;
	info?: string;
	waypoints: TaskWaypoint[];
}

/**
 * Parse a .tsk file (GPX/XML format used by XCTrack / Task Planner).
 * Regex-based — no DOM dependency, works in Node.js server components.
 */
export function parseTskXml(xml: string): ParsedTask {
	// Helper: get first match of <tag>...</tag> within a string
	const getText = (src: string, tag: string): string | undefined => {
		const m = src.match(
			new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
		);
		return m ? m[1].trim() : undefined;
	};

	const result: ParsedTask = {
		date: getText(xml, "date"),
		taskType: getText(xml, "type"),
		info: getText(xml, "info"),
		waypoints: [],
	};

	// Split on <rtept ...> blocks
	const rteptRegex = /<rtept\s([^>]*)>([\s\S]*?)<\/rtept>/gi;
	let match: RegExpExecArray | null;

	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
	while ((match = rteptRegex.exec(xml)) !== null) {
		const attrs = match[1];
		const body = match[2];

		const getAttr = (name: string) => {
			const m = attrs.match(new RegExp(`${name}="([^"]+)"`));
			return m ? m[1] : undefined;
		};

		const lat = parseFloat(getAttr("lat") ?? "0");
		const lon = parseFloat(getAttr("lon") ?? "0");
		const id = getText(body, "id")?.trim();
		const name = getText(body, "name") ?? "";
		const altM = parseFloat(getText(body, "z") ?? "0");
		const radiusM = parseFloat(getText(body, "radius") ?? "400");
		const rawType = getText(body, "type") ?? "turnpoint";
		const mode = getText(body, "mode") ?? "entry";
		const open = getText(body, "open");
		const close = getText(body, "close");

		let type: TurnpointType = "turnpoint";
		if (rawType === "takeoff") type = "takeoff";
		else if (rawType === "goal") type = "goal";
		else if (rawType === "sss") type = "sss";
		else if (rawType === "ess") type = "ess";

		result.waypoints.push({
			id: id && id.length > 0 ? id : undefined,
			name,
			lat,
			lon,
			altM,
			radiusM,
			type,
			mode,
			open,
			close,
		});
	}

	return result;
}
