import * as cheerio from "cheerio";

/**
 * Telegram caps photo captions at 1024 characters, counted on the text left
 * after entity parsing, i.e. without the HTML tags.
 */
export const TELEGRAM_CAPTION_LIMIT = 1024;

// Tags Telegram's HTML parse mode understands, mapped from what the Lexical
// editor emits. Everything else is unwrapped to its text.
const INLINE_TAGS: Record<string, string> = {
	b: "b",
	strong: "b",
	i: "i",
	em: "i",
	u: "u",
	ins: "u",
	s: "s",
	strike: "s",
	del: "s",
	code: "code",
};

const BLOCK_TAGS = new Set([
	"p",
	"div",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"blockquote",
	"pre",
	"ul",
	"ol",
]);

export function escapeTelegramHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
	return escapeTelegramHtml(value).replaceAll('"', "&quot;");
}

/**
 * A caption is built as a list of segments so it can be cut at a character
 * budget without ever splitting a tag or an entity: only text is counted, and
 * each open tag is closed wherever the cut lands.
 */
type Segment =
	| { kind: "text"; text: string }
	| { kind: "open"; tag: string; html: string }
	| { kind: "close"; tag: string };

type HtmlNode = ReturnType<cheerio.CheerioAPI["root"]>["0"]["children"][number];

function htmlToSegments(html: string): Segment[] {
	const $ = cheerio.load(html, null, false);
	const segments: Segment[] = [];
	const open = new Set<string>();

	const textSoFar = () =>
		segments
			.map((segment) => (segment.kind === "text" ? segment.text : ""))
			.join("");

	// Ensures the text ends with at least `count` line breaks, never leading
	// with them. Descriptions are short, so rescanning the text is fine.
	const pushBreak = (count: number) => {
		const text = textSoFar();
		if (!text.trim()) return;
		const trailing = text.match(/\n*$/)?.[0].length ?? 0;
		if (trailing < count) {
			segments.push({ kind: "text", text: "\n".repeat(count - trailing) });
		}
	};

	const walk = (nodes: HtmlNode[], listDepth: number) => {
		for (const node of nodes) {
			if (node.type === "text") {
				// Source HTML whitespace is insignificant; line breaks come from tags.
				const text = node.data.replace(/\s+/g, " ");
				if (text) segments.push({ kind: "text", text });
				continue;
			}
			if (node.type !== "tag") continue;

			const tag = node.name.toLowerCase();
			const children = node.children;

			if (tag === "br") {
				segments.push({ kind: "text", text: "\n" });
			} else if (tag === "li") {
				pushBreak(1);
				segments.push({ kind: "text", text: `${"  ".repeat(listDepth)}• ` });
				walk(children, listDepth + 1);
				pushBreak(1);
			} else if (tag === "a" && node.attribs.href?.match(/^https?:\/\//)) {
				segments.push({
					kind: "open",
					tag: "a",
					html: `<a href="${escapeAttribute(node.attribs.href)}">`,
				});
				walk(children, listDepth);
				segments.push({ kind: "close", tag: "a" });
			} else if (INLINE_TAGS[tag] && !open.has(INLINE_TAGS[tag])) {
				// Lexical nests <b><strong>, which would otherwise become <b><b>.
				const mapped = INLINE_TAGS[tag];
				open.add(mapped);
				segments.push({ kind: "open", tag: mapped, html: `<${mapped}>` });
				walk(children, listDepth);
				segments.push({ kind: "close", tag: mapped });
				open.delete(mapped);
			} else if (BLOCK_TAGS.has(tag)) {
				pushBreak(2);
				walk(children, listDepth);
				pushBreak(2);
			} else {
				walk(children, listDepth);
			}
		}
	};

	walk($.root().contents().toArray(), 0);
	return tidy(segments);
}

/**
 * Merges adjacent text segments, then trims spaces around line breaks and
 * whitespace at both ends. Merging first matters: the editor wraps every run
 * in its own <span>, so a space and the break after it are separate nodes.
 */
function tidy(segments: Segment[]): Segment[] {
	const merged: Segment[] = [];
	for (const segment of segments) {
		const last = merged.at(-1);
		if (segment.kind === "text" && last?.kind === "text") {
			last.text += segment.text;
		} else {
			merged.push({ ...segment });
		}
	}

	for (const segment of merged) {
		if (segment.kind === "text") {
			segment.text = segment.text.replace(/ *\n */g, "\n");
		}
	}

	const texts = merged.filter((segment) => segment.kind === "text");
	const first = texts.at(0);
	const last = texts.at(-1);
	if (first) first.text = first.text.trimStart();
	if (last) last.text = last.text.trimEnd();

	return merged.filter(
		(segment) => segment.kind !== "text" || segment.text.length > 0,
	);
}

function textLength(segments: Segment[]): number {
	return segments.reduce(
		(length, segment) =>
			segment.kind === "text" ? length + [...segment.text].length : length,
		0,
	);
}

/**
 * Renders segments to Telegram HTML, keeping at most `budget` characters of
 * text. When the text is cut, an ellipsis is appended and every tag still open
 * at the cut is closed.
 */
function renderSegments(segments: Segment[], budget: number): string {
	const total = textLength(segments);
	const truncate = total > budget;
	// Leave room for the ellipsis.
	let remaining = truncate ? Math.max(budget - 1, 0) : budget;

	let html = "";
	const open: string[] = [];

	for (const segment of segments) {
		if (segment.kind === "open") {
			if (remaining === 0) break;
			html += segment.html;
			open.push(segment.tag);
		} else if (segment.kind === "close") {
			html += `</${segment.tag}>`;
			open.pop();
		} else {
			const chars = [...segment.text];
			if (chars.length <= remaining) {
				html += escapeTelegramHtml(segment.text);
				remaining -= chars.length;
				continue;
			}
			// Prefer cutting at a word boundary when one is reasonably close.
			let cut = chars.slice(0, remaining).join("");
			const lastSpace = cut.search(/\s\S*$/);
			if (lastSpace > cut.length - 40 && lastSpace > 0) {
				cut = cut.slice(0, lastSpace);
			}
			html += escapeTelegramHtml(cut.trimEnd());
			remaining = 0;
			break;
		}
	}

	if (truncate) html += "…";
	for (const tag of open.reverse()) html += `</${tag}>`;
	return html;
}

export type EventCaptionInput = {
	id: string;
	title: string;
	description: string;
	eventDate: Date;
	startTime?: string | null;
	endTime?: string | null;
	location?: string | null;
	isMemberOnly: boolean;
};

function formatEventDate(date: Date): string {
	// Event dates are stored as midnight UTC for the chosen day.
	return new Intl.DateTimeFormat("it-IT", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(date);
}

/**
 * Builds the HTML caption for an event announcement. The header (title, date,
 * place) and the footer link are always kept whole; the description fills
 * whatever budget is left and is cut first.
 */
export function buildEventCaption(
	event: EventCaptionInput,
	eventUrl: string,
): string {
	const header: string[] = [`<b>${escapeTelegramHtml(event.title)}</b>`];

	const time = [event.startTime, event.endTime].filter(Boolean).join(" – ");
	header.push(
		`📅 ${escapeTelegramHtml(formatEventDate(event.eventDate))}${time ? `, ${escapeTelegramHtml(time)}` : ""}`,
	);
	if (event.location) {
		header.push(`📍 ${escapeTelegramHtml(event.location)}`);
	}
	if (event.isMemberOnly) {
		header.push("🔒 Riservato ai soci");
	}

	const headerHtml = header.join("\n");
	const footerHtml = `<a href="${escapeAttribute(eventUrl)}">Dettagli e iscrizioni →</a>`;

	const plainLength = (html: string) =>
		[...cheerio.load(html, null, false).root().text()].length;
	const separators = 4; // two "\n\n" around the description
	const budget =
		TELEGRAM_CAPTION_LIMIT -
		plainLength(headerHtml) -
		plainLength(footerHtml) -
		separators;

	const descriptionHtml = renderSegments(
		htmlToSegments(event.description),
		Math.max(budget, 0),
	);

	return [headerHtml, descriptionHtml, footerHtml].filter(Boolean).join("\n\n");
}
