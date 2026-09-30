import { ServerBlockNoteEditor } from "@blocknote/server-util";
import sanitizeHtml from "sanitize-html";
import { type NewsPartialBlock, newsSchema } from "@/lib/news-schema";

/**
 * Renders stored news blocks to the HTML shown on the public page. Runs once
 * on save, so the page itself needs neither the editor nor jsdom.
 *
 * The output is sanitised even though only admins write news: BlockNote
 * escapes text but passes block props such as an image URL through as-is.
 */
let editor: ReturnType<typeof createEditor> | undefined;

function createEditor() {
	return ServerBlockNoteEditor.create({ schema: newsSchema });
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: [
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"p",
		"br",
		"hr",
		"strong",
		"b",
		"em",
		"i",
		"u",
		"s",
		"del",
		"code",
		"span",
		"a",
		"ul",
		"ol",
		"li",
		"input",
		"blockquote",
		"figure",
		"figcaption",
		"img",
		"table",
		"colgroup",
		"col",
		"thead",
		"tbody",
		"tr",
		"th",
		"td",
		"details",
		"summary",
	],
	allowedAttributes: {
		a: ["href", "target", "rel"],
		img: ["src", "alt", "width"],
		input: ["type", "checked", "disabled"],
		th: ["colspan", "rowspan"],
		td: ["colspan", "rowspan"],
		ol: ["start"],
		// Text and background colours picked in the editor.
		span: ["style"],
		p: ["style"],
		"*": [],
	},
	allowedStyles: {
		"*": {
			color: [/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/],
			"background-color": [/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/],
			"text-align": [/^(left|right|center|justify)$/],
		},
	},
	allowedSchemes: ["http", "https", "mailto"],
	allowedSchemesByTag: { img: ["https"] },
	allowProtocolRelative: false,
	transformTags: {
		// Links always leave the page, and never pass on the opener.
		a: sanitizeHtml.simpleTransform("a", {
			target: "_blank",
			rel: "noopener noreferrer",
		}),
		// Checklist boxes are for reading, not ticking.
		input: sanitizeHtml.simpleTransform("input", { disabled: "" }),
	},
	exclusiveFilter: (frame) =>
		// An image whose URL was dropped as unsafe has nothing left to show.
		(frame.tag === "img" && !frame.attribs.src) ||
		// Only checkboxes: the editor emits no other input.
		(frame.tag === "input" && frame.attribs.type !== "checkbox") ||
		// Empty paragraphs are the editor's spacers (it keeps one after every
		// image and at the end); the page's own spacing replaces them.
		(frame.tag === "p" && !frame.text.trim() && !frame.mediaChildren.length),
};

// BlockNote marks an empty paragraph with U+FFFC, which browsers draw as a
// box.
const OBJECT_REPLACEMENT = /\uFFFC/g;

export async function renderNewsHtml(
	blocks: NewsPartialBlock[],
): Promise<string> {
	editor ??= createEditor();
	const html = await editor.blocksToHTMLLossy(blocks);
	return sanitizeHtml(html.replace(OBJECT_REPLACEMENT, ""), SANITIZE_OPTIONS);
}
