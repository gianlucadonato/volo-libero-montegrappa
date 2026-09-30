import { describe, expect, it } from "vitest";
import { markdownToNewsBlocks, renderNewsHtml } from "@/lib/news-render";
import type { NewsPartialBlock } from "@/lib/news-schema";

const paragraph = (
	content: NonNullable<NewsPartialBlock["content"]>,
): NewsPartialBlock => ({ type: "paragraph", content }) as NewsPartialBlock;

describe("renderNewsHtml", () => {
	it("renders headings, lists and formatting", async () => {
		const blocks = await markdownToNewsBlocks(
			"## Titolo\n\nTesto **forte** e *corsivo*.\n\n- uno\n- due",
		);
		const html = await renderNewsHtml(blocks);
		expect(html).toContain("<h2>Titolo</h2>");
		expect(html).toContain("<strong>forte</strong>");
		expect(html).toContain("<em>corsivo</em>");
		expect(html).toMatch(
			/<ul><li><p>uno<\/p><\/li><li><p>due<\/p><\/li><\/ul>/,
		);
	});

	it("opens links in a new tab safely", async () => {
		const html = await renderNewsHtml(
			await markdownToNewsBlocks("[sito](https://example.com)"),
		);
		expect(html).toContain(
			'<a href="https://example.com" target="_blank" rel="noopener noreferrer">sito</a>',
		);
	});

	it("drops javascript: links but keeps their text", async () => {
		const html = await renderNewsHtml([
			paragraph([
				{
					type: "link",
					href: "javascript:alert(1)",
					content: [{ type: "text", text: "clic", styles: {} }],
				},
			]),
		]);
		expect(html).not.toContain("javascript:");
		expect(html).toContain("clic");
	});

	it("escapes raw HTML typed as text", async () => {
		const html = await renderNewsHtml([
			paragraph([
				{ type: "text", text: "<script>alert(1)</script>", styles: {} },
			]),
		]);
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("keeps https images and drops other sources", async () => {
		const html = await renderNewsHtml([
			{
				type: "image",
				props: { url: "https://bucket/news/images/a.jpg" },
			} as NewsPartialBlock,
			{
				type: "image",
				props: { url: "javascript:alert(1)" },
			} as NewsPartialBlock,
		]);
		expect(html).toContain('src="https://bucket/news/images/a.jpg"');
		expect(html).not.toContain("javascript:");
	});

	it("keeps colours and alignment, drops other styles", async () => {
		const html = await renderNewsHtml([
			{
				type: "paragraph",
				props: { textAlignment: "center" },
				content: [
					{ type: "text", text: "rosso", styles: { textColor: "red" } },
				],
			} as NewsPartialBlock,
		]);
		expect(html).toContain("text-align");
		expect(html).toContain("rosso");
		expect(html).not.toMatch(/style="[^"]*(position|url\()/);
	});

	it("drops the editor's empty spacer paragraphs and their U+FFFC", async () => {
		const html = await renderNewsHtml([
			paragraph([{ type: "text", text: "uno", styles: {} }]),
			{ type: "paragraph" } as NewsPartialBlock,
			{
				type: "image",
				props: { url: "https://bucket/news/images/a.jpg" },
			} as NewsPartialBlock,
			{ type: "paragraph" } as NewsPartialBlock,
		]);
		expect(html).not.toContain("\uFFFC");
		expect(html).toBe(
			'<p>uno</p><img src="https://bucket/news/images/a.jpg" alt="" />',
		);
	});

	it("renders check list items as disabled boxes", async () => {
		const html = await renderNewsHtml([
			{
				type: "checkListItem",
				props: { checked: true },
				content: [{ type: "text", text: "fatto", styles: {} }],
			} as NewsPartialBlock,
		]);
		expect(html).toBe(
			'<ul><li><input type="checkbox" checked disabled /><p>fatto</p></li></ul>',
		);
	});
});
