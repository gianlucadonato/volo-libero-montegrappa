import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Markdoc, { type Node } from "@markdoc/markdoc";
import { load } from "js-yaml";
import { z } from "zod";

/**
 * Static markdown pages (privacy policy, terms, MOG, …) rendered at
 * /<slug> from content/pages/*.mdx.
 *
 * These are legal and institutional documents: they change once a year at
 * most, and are edited as files rather than through Keystatic, so they are
 * read straight off disk instead of going through the CMS reader. The
 * directory ships in the image (see the `COPY … /app/content` in the
 * Dockerfile).
 *
 * The bodies are plain markdown despite the .mdx extension — a legacy of the
 * previous site, which ran them through Contentlayer. Nothing imports or
 * renders a component, so they are parsed with Markdoc, the same engine the
 * news collection already uses.
 */

const PAGES_DIR = join(process.cwd(), "content", "pages");

const FrontmatterSchema = z.object({
	title: z.string().min(1),
	description: z.string().optional(),
});

export type PageEntry = {
	slug: string;
	title: string;
	description?: string;
	node: Node;
};

function parse(slug: string, raw: string): PageEntry {
	// Markdoc drops raw HTML rather than escaping it, so these bodies must stay
	// plain markdown: an <ins>/<b>/<div> here would silently lose its formatting.
	const node = Markdoc.parse(raw);
	// Markdoc hands back the frontmatter as the raw YAML string, unparsed.
	const frontmatter = FrontmatterSchema.parse(
		load(node.attributes.frontmatter ?? "") ?? {},
	);
	return { slug, ...frontmatter, node };
}

export function listPageSlugs(): string[] {
	return readdirSync(PAGES_DIR)
		.filter((name) => name.endsWith(".mdx"))
		.map((name) => name.slice(0, -".mdx".length))
		.sort();
}

export function getPage(slug: string): PageEntry | null {
	// The slug reaches this from the URL, so anything that is not a bare
	// filename we generated must not become a path to read.
	if (!listPageSlugs().includes(slug)) return null;
	return parse(slug, readFileSync(join(PAGES_DIR, `${slug}.mdx`), "utf8"));
}
