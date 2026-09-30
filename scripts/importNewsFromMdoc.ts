/**
 * Imports the news written in Keystatic (content/news/it/*.mdoc) into the news
 * table, converting the Markdown body to BlockNote blocks and uploading each
 * cover from public/ to the public assets bucket.
 *
 * The file name becomes the slug, so links shared before the move keep
 * working. Idempotent: news whose slug already exists are skipped, so a re-run
 * only picks up the ones a failed run missed.
 *
 * Dry run by default:
 *
 *   pnpm exec tsx --env-file=.env.production scripts/importNewsFromMdoc.ts
 *   pnpm exec tsx --env-file=.env.production scripts/importNewsFromMdoc.ts --apply
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import { load as loadYaml } from "js-yaml";
import { NEWS_IMAGES_PREFIX } from "@/config/constants";
import { markdownToNewsBlocks, renderNewsHtml } from "@/lib/news-render";
import { prisma } from "@/lib/prisma";
import { uploadPublicImage } from "@/lib/public-images";

const APPLY = process.argv.includes("--apply");
const CONTENT_DIR = path.join(process.cwd(), "content", "news", "it");
const PUBLIC_DIR = path.join(process.cwd(), "public");

type Frontmatter = {
	title: string;
	publishedAt: string | Date;
	draft?: boolean;
	excerpt?: string;
	coverImage?: string;
};

type Entry = { slug: string; frontmatter: Frontmatter; body: string };

async function readEntries(): Promise<Entry[]> {
	const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".mdoc"));
	return Promise.all(
		files.sort().map(async (file) => {
			const source = await readFile(path.join(CONTENT_DIR, file), "utf8");
			const [, rawFrontmatter, ...rest] = source.split(/^---$/m);
			return {
				slug: file.replace(/\.mdoc$/, ""),
				frontmatter: loadYaml(rawFrontmatter) as Frontmatter,
				// Keystatic's editor couldn't nest lists, so posts faked it with
				// leading non-breaking spaces. Turn them into a real indent.
				body: rest
					.join("---")
					.replace(/^(?:&nbsp;\s*)+/gm, "  ")
					.trim(),
			};
		}),
	);
}

/** YAML turns a bare 2026-04-01 into a Date at midnight UTC already. */
function toDate(value: string | Date): Date {
	return value instanceof Date ? value : new Date(value);
}

async function confirmTarget(count: number) {
	// Show the host only: the URL carries credentials.
	const host = process.env.DATABASE_URL?.match(/@([^/?]+)/)?.[1] ?? "unknown";
	console.warn(
		`\n⚠️  WARNING\nDATABASE_URL host is "${host}"\n\nThis will upload ${count} covers and INSERT rows in news.`,
	);
	const proceed = await confirm({ message: "Continue?", default: false });
	if (!proceed) {
		console.log("Aborted.");
		process.exit(0);
	}
}

async function main() {
	const entries = await readEntries();
	const existing = new Set(
		(
			await prisma.news.findMany({
				where: { slug: { in: entries.map((entry) => entry.slug) } },
				select: { slug: true },
			})
		).map((news) => news.slug),
	);
	const pending = entries.filter((entry) => !existing.has(entry.slug));

	console.log(
		`\n${APPLY ? "⬆️  Applying" : "🔍 Dry run"} — ${entries.length} news found, ${pending.length} to import.\n`,
	);

	// Convert everything up front, in dry runs too, so a post that doesn't
	// parse shows up before anything is written.
	const prepared = [];
	for (const entry of pending) {
		const blocks = await markdownToNewsBlocks(entry.body);
		const html = await renderNewsHtml(blocks);
		prepared.push({ ...entry, blocks, html });
		const { title, publishedAt, draft, coverImage } = entry.frontmatter;
		console.log(
			`   ${entry.slug}\n      "${title}", ${toDate(publishedAt).toISOString().slice(0, 10)}${draft ? ", draft" : ""}, ${blocks.length} blocks, cover: ${coverImage ?? "none"}`,
		);
	}

	if (!APPLY) {
		console.log(`\n🔍 Dry run: nothing written. Re-run with --apply.`);
		return;
	}

	if (prepared.length === 0) return;
	await confirmTarget(prepared.length);

	let imported = 0;
	const failed: string[] = [];

	for (const { slug, frontmatter, blocks, html } of prepared) {
		try {
			// Upload before inserting: a crash in between leaves an orphan
			// object, never a news pointing at a missing cover.
			const coverUrl = frontmatter.coverImage
				? await uploadPublicImage(
						await readFile(path.join(PUBLIC_DIR, frontmatter.coverImage)),
						NEWS_IMAGES_PREFIX,
					)
				: null;
			await prisma.news.create({
				data: {
					slug,
					title: frontmatter.title,
					excerpt: frontmatter.excerpt?.trim() || null,
					coverUrl,
					content: blocks as object[],
					contentHtml: html,
					publishedAt: toDate(frontmatter.publishedAt),
					draft: frontmatter.draft ?? false,
				},
			});
			imported += 1;
			console.log(`   ✓ ${slug}${coverUrl ? ` -> ${coverUrl}` : ""}`);
		} catch (error) {
			console.error(`   ✗ ${slug}:`, error);
			failed.push(slug);
		}
	}

	console.log(
		`\n✨ Done: ${imported} imported, ${failed.length} failed, ${prepared.length} total.`,
	);
	if (failed.length > 0) process.exitCode = 1;
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
