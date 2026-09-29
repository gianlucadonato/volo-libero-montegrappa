/**
 * Moves event covers stored inline as base64 data URLs in events.image_url to
 * the public assets bucket, and rewrites the column to the public URL.
 *
 *   "data:image/jpeg;base64,/9j/4AAQ…"
 *   -> "https://vlm-xc-public.s3.eu-central-1.amazonaws.com/events/covers/<uuid>.jpg"
 *
 * Idempotent: only rows still holding a data URL are touched, so a re-run
 * picks up where a failed one stopped. Each cover is uploaded before its row is
 * updated, so a crash in between leaves an orphan object, never a broken row.
 *
 * Dry run by default:
 *
 *   pnpm exec tsx --env-file=.env.production scripts/migrateEventCoversToS3.ts
 *   pnpm exec tsx --env-file=.env.production scripts/migrateEventCoversToS3.ts --apply
 */
import { confirm } from "@inquirer/prompts";
import { decodeImageDataUrl, uploadEventCover } from "@/lib/event-covers";
import { prisma } from "@/lib/prisma";

const APPLY = process.argv.includes("--apply");

async function confirmTarget(count: number) {
	// Show the host only: the URL carries credentials.
	const host = process.env.DATABASE_URL?.match(/@([^/?]+)/)?.[1] ?? "unknown";
	console.warn(
		`\n⚠️  WARNING\nDATABASE_URL host is "${host}"\n\nThis will upload ${count} covers and UPDATE rows in events.`,
	);
	const proceed = await confirm({ message: "Continue?", default: false });
	if (!proceed) {
		console.log("Aborted.");
		process.exit(0);
	}
}

async function main() {
	// Select ids first: loading every data URL at once is what we're getting
	// rid of.
	const events = await prisma.event.findMany({
		where: { imageUrl: { startsWith: "data:" } },
		select: { id: true, title: true },
		orderBy: { eventDate: "asc" },
	});

	console.log(
		`\n${APPLY ? "⬆️  Applying" : "🔍 Dry run"} — ${events.length} events hold an inline cover.\n`,
	);

	if (!APPLY) {
		for (const event of events) console.log(`   ${event.id}  ${event.title}`);
		console.log(`\n🔍 Dry run: nothing written. Re-run with --apply.`);
		return;
	}

	if (events.length === 0) return;
	await confirmTarget(events.length);

	let migrated = 0;
	const failed: string[] = [];

	for (const { id, title } of events) {
		const row = await prisma.event.findUnique({
			where: { id },
			select: { imageUrl: true },
		});
		const bytes = row?.imageUrl ? decodeImageDataUrl(row.imageUrl) : null;
		if (!bytes) {
			console.error(`   ✗ ${id}  ${title}: not a decodable image data URL`);
			failed.push(id);
			continue;
		}

		try {
			const url = await uploadEventCover(bytes);
			await prisma.event.update({ where: { id }, data: { imageUrl: url } });
			migrated += 1;
			console.log(
				`   ✓ ${id}  ${title} (${Math.round(bytes.length / 1024)} KB) -> ${url}`,
			);
		} catch (error) {
			console.error(`   ✗ ${id}  ${title}:`, error);
			failed.push(id);
		}
	}

	console.log(
		`\n✨ Done: ${migrated} migrated, ${failed.length} failed, ${events.length} total.`,
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
