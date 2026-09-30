import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import {
	buildEventCaption,
	buildNewsCaption,
	TELEGRAM_CAPTION_LIMIT,
} from "@/lib/telegram-caption";

const URL = "https://www.vololiberomontegrappa.it/events/evt1";

const base = {
	id: "evt1",
	title: "Befana Cup 2025",
	description: "<p>Ciao</p>",
	eventDate: new Date("2025-01-06T00:00:00.000Z"),
	startTime: null,
	endTime: null,
	location: null,
	isMemberOnly: false,
};

const textLength = (html: string) =>
	[...cheerio.load(html, null, false).root().text()].length;

/** Checks every opened tag is closed, in order. */
function isBalanced(html: string) {
	const stack: string[] = [];
	for (const [, closing, tag] of html.matchAll(/<(\/?)([a-z]+)[^>]*>/g)) {
		if (!closing) stack.push(tag);
		else if (stack.pop() !== tag) return false;
	}
	return stack.length === 0;
}

describe("buildEventCaption", () => {
	it("renders header, description and link", () => {
		const caption = buildEventCaption(
			{
				...base,
				startTime: "10:00",
				endTime: "17:00",
				location: "Garden Relais",
			},
			URL,
		);
		expect(caption).toBe(
			[
				"<b>Befana Cup 2025</b>",
				"📅 lunedì 6 gennaio 2025, 10:00 – 17:00",
				"📍 Garden Relais",
				"",
				"Ciao",
				"",
				`<a href="${URL}">Dettagli e iscrizioni →</a>`,
			].join("\n"),
		);
	});

	it("flags members-only events", () => {
		expect(buildEventCaption({ ...base, isMemberOnly: true }, URL)).toContain(
			"🔒 Riservato ai soci",
		);
	});

	it("converts Lexical HTML to Telegram tags", () => {
		const description =
			'<p class="leading-7"><span style="white-space: pre-wrap;">In collaborazione con l’</span><b><strong class="font-bold">ASD Volo Libero</strong></b><span>.</span></p>' +
			'<p class="text-node"><span style="color: rgb(8, 8, 9)">Riga uno </span><br><span>riga <i>due</i> e <a href="https://elmeteo.it">link</a>.</span></p>' +
			"<ul><li>primo</li><li>secondo</li></ul>";
		const caption = buildEventCaption({ ...base, description }, URL);

		expect(caption).toContain(
			'In collaborazione con l’<b>ASD Volo Libero</b>.\n\nRiga uno\nriga <i>due</i> e <a href="https://elmeteo.it">link</a>.\n\n• primo\n• secondo',
		);
		expect(caption).not.toMatch(/<(p|span|strong|ul|li|br)\b/);
		expect(caption).not.toContain("style=");
	});

	it("escapes text and drops unsafe links", () => {
		const caption = buildEventCaption(
			{
				...base,
				title: "A <b> & B",
				description: '<p>1 < 2 &amp; <a href="javascript:alert(1)">x</a></p>',
			},
			URL,
		);
		expect(caption).toContain("<b>A &lt;b&gt; &amp; B</b>");
		expect(caption).toContain("1 &lt; 2 &amp; x");
		expect(caption).not.toContain("javascript:");
	});

	it("truncates long descriptions within the caption limit, keeping tags balanced", () => {
		const description = `<p>${"parola ".repeat(100)}<b>${"grassetto ".repeat(200)}</b></p>`;
		const caption = buildEventCaption(
			{ ...base, description, location: "Borso del Grappa" },
			URL,
		);

		expect(textLength(caption)).toBeLessThanOrEqual(TELEGRAM_CAPTION_LIMIT);
		expect(textLength(caption)).toBeGreaterThan(TELEGRAM_CAPTION_LIMIT - 60);
		expect(isBalanced(caption)).toBe(true);
		expect(caption).toMatch(/…<\/b>\n\n<a href/);
		expect(caption.endsWith("Dettagli e iscrizioni →</a>")).toBe(true);
	});

	it("counts emoji and accents as single characters", () => {
		const description = `<p>${"è🪂".repeat(600)}</p>`;
		const caption = buildEventCaption({ ...base, description }, URL);
		expect(textLength(caption)).toBeLessThanOrEqual(TELEGRAM_CAPTION_LIMIT);
	});

	it("omits an empty description", () => {
		const caption = buildEventCaption(
			{ ...base, description: "<p><br></p>" },
			URL,
		);
		expect(caption).not.toContain("\n\n\n");
		expect(caption.split("\n\n")).toHaveLength(2);
	});
});

describe("buildNewsCaption", () => {
	const NEWS_URL = "https://www.vololiberomontegrappa.it/news/cena-sociale";
	const news = {
		title: "Cena & premiazioni",
		excerpt: "Ci vediamo sabato",
		contentHtml: "<p>Il testo completo</p>",
	};

	it("uses the summary when there is one", () => {
		expect(buildNewsCaption(news, NEWS_URL)).toBe(
			`<b>Cena &amp; premiazioni</b>\n\nCi vediamo sabato\n\n<a href="${NEWS_URL}">Leggi la news →</a>`,
		);
	});

	it("falls back to the rendered text", () => {
		const caption = buildNewsCaption(
			{
				...news,
				excerpt: " ",
				contentHtml:
					'<h2>Menu</h2><ul><li><p>Pizza</p></li></ul><img src="https://x/a.jpg" alt="" /><p><strong>Sabato</strong></p>',
			},
			NEWS_URL,
		);
		expect(caption).toContain("Menu\n\n• Pizza\n\n<b>Sabato</b>");
		expect(caption).not.toContain("<img");
	});

	it("fits long news in the caption limit", () => {
		const caption = buildNewsCaption(
			{
				...news,
				excerpt: null,
				contentHtml: `<p>${"parola ".repeat(400)}</p>`,
			},
			NEWS_URL,
		);
		expect(textLength(caption)).toBeLessThanOrEqual(TELEGRAM_CAPTION_LIMIT);
		expect(caption).toContain("…");
		expect(caption.endsWith("Leggi la news →</a>")).toBe(true);
		expect(isBalanced(caption)).toBe(true);
	});
});
