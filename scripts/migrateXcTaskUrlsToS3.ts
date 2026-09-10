/**
 * Rewrites xc_tasks.image_url / task_file_url between the legacy public/ paths
 * and the public S3 assets bucket.
 *
 *   "/xcmontegrappa/basic/01/b01.png"
 *   -> "https://<bucket>.s3.<region>.amazonaws.com/xcmontegrappa/basic/01/b01.png"
 *
 * Idempotent: rows already in the target form are skipped, so a re-run is a
 * no-op. `--revert` maps the URLs back to root-relative, which is the rollback
 * lever while the files are still in public/.
 *
 * NOTE: this must run against production — the local dev database has no XC
 * tables, and `pnpm tsx` only ever loads .env:
 *
 *   pnpm exec tsx --env-file=.env.production scripts/migrateXcTaskUrlsToS3.ts
 *   pnpm exec tsx --env-file=.env.production scripts/migrateXcTaskUrlsToS3.ts --apply
 *   pnpm exec tsx --env-file=.env.production scripts/migrateXcTaskUrlsToS3.ts --apply --revert
 */
import { confirm } from "@inquirer/prompts";
import { XC_PUBLIC_ASSETS_BASE_URL } from "@/config/constants";
import { prisma } from "@/lib/prisma";

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");

const ROOT_RELATIVE_PREFIX = "/xcmontegrappa/";
const ABSOLUTE_PREFIX = `${XC_PUBLIC_ASSETS_BASE_URL}${ROOT_RELATIVE_PREFIX}`;

/** Returns the rewritten URL, or null when it is already in the target form. */
function rewrite(url: string | null): string | null {
	if (!url) return null;
	if (REVERT) {
		return url.startsWith(ABSOLUTE_PREFIX)
			? url.slice(XC_PUBLIC_ASSETS_BASE_URL.length)
			: null;
	}
	return url.startsWith(ROOT_RELATIVE_PREFIX)
		? `${XC_PUBLIC_ASSETS_BASE_URL}${url}`
		: null;
}

async function confirmTarget() {
	// Show the host only: the URL carries credentials.
	const host = process.env.DATABASE_URL?.match(/@([^/?]+)/)?.[1] ?? "unknown";
	console.warn(
		`\n⚠️  WARNING\nDATABASE_URL host is "${host}"\nDirection: ${
			REVERT ? "S3 URL -> /xcmontegrappa/…" : "/xcmontegrappa/… -> S3 URL"
		}\n\nThis will UPDATE rows in xc_tasks.`,
	);
	const proceed = await confirm({ message: "Continue?", default: false });
	if (!proceed) {
		console.log("Aborted.");
		process.exit(0);
	}
}

async function main() {
	if (APPLY) await confirmTarget();

	const tasks = await prisma.xcTask.findMany({
		select: { id: true, slug: true, imageUrl: true, taskFileUrl: true },
		orderBy: { slug: "asc" },
	});

	const changes = tasks.flatMap((task) => {
		const imageUrl = rewrite(task.imageUrl);
		const taskFileUrl = rewrite(task.taskFileUrl);
		if (!imageUrl && !taskFileUrl) return [];
		return [{ task, imageUrl, taskFileUrl }];
	});

	console.log(
		`\n${APPLY ? "⬆️  Applying" : "🔍 Dry run"} — ${changes.length} of ${
			tasks.length
		} rows need rewriting (${tasks.length - changes.length} already done).\n`,
	);

	for (const { task, imageUrl, taskFileUrl } of changes.slice(0, 3)) {
		console.log(`   ${task.slug}:`);
		if (imageUrl) console.log(`     ${task.imageUrl}\n       -> ${imageUrl}`);
		if (taskFileUrl)
			console.log(`     ${task.taskFileUrl}\n       -> ${taskFileUrl}`);
	}
	if (changes.length > 3) console.log(`   … and ${changes.length - 3} more`);

	if (!APPLY) {
		console.log(`\n🔍 Dry run: nothing written. Re-run with --apply.`);
		return;
	}

	let updated = 0;
	for (const { task, imageUrl, taskFileUrl } of changes) {
		await prisma.xcTask.update({
			where: { id: task.id },
			data: {
				...(imageUrl ? { imageUrl } : {}),
				...(taskFileUrl ? { taskFileUrl } : {}),
			},
		});
		updated += 1;
	}

	console.log(
		`\n✨ Done: ${updated} updated, ${tasks.length - updated} skipped, ${
			tasks.length
		} total.`,
	);
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
