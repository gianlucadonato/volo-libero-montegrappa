/**
 * Database sync/dump/restore CLI.
 *
 * Copies a PostgreSQL database into another, or performs just one half of that
 * (dump only / restore only). Connection URLs come from the environment:
 *   - DB_SYNC_FROM  source database (libpq URL, e.g. postgresql://user:pwd@host:5432/db)
 *   - DB_SYNC_TO    target database (libpq URL)
 *
 * Run via `pnpm db:sync` (append flags after it).
 *
 * Flags:
 *   (none)                     Full sync: dump DB_SYNC_FROM into DB_SYNC_TO
 *                              (uses a temp dump that is deleted afterwards).
 *   --saveDump                 Full sync, but keep the dump as ./dump.pgdump.
 *   --onlyDump                 Dump DB_SYNC_FROM to ./dump.pgdump; no restore
 *                              (DB_SYNC_TO not required).
 *   --fromDumpFile <path>      Restore an existing dump file into DB_SYNC_TO;
 *   --fromDumpFile=<path>      no dump step (DB_SYNC_FROM not required).
 *
 * Examples:
 *   pnpm db:sync
 *   pnpm db:sync --saveDump
 *   pnpm db:sync --onlyDump
 *   pnpm db:sync --fromDumpFile ./dump.pgdump
 *
 * Note: dump files are PostgreSQL custom-format archives (pg_dump/pg_restore
 * must be available on PATH). Both --saveDump and --onlyDump write a fixed
 * ./dump.pgdump, overwriting any existing one.
 */
import { confirm } from "@inquirer/prompts";
import { dumpDatabase, restoreDatabase, syncDatabase } from "@/actions/db-sync";

/** Reads the value of a `--flag <value>` / `--flag=<value>` argument. */
function getFlagValue(name: string): string | undefined {
	const argv = process.argv;
	const inline = argv.find((arg) => arg.startsWith(`${name}=`));
	if (inline) return inline.slice(name.length + 1);
	const idx = argv.indexOf(name);
	const value = idx === -1 ? undefined : argv[idx + 1];
	return value && !value.startsWith("--") ? value : undefined;
}

const DB_SYNC_FROM = process.env.DB_SYNC_FROM;
const DB_SYNC_TO = process.env.DB_SYNC_TO;
const SAVE_DUMP = process.argv.includes("--saveDump");
const ONLY_DUMP = process.argv.includes("--onlyDump");
const FROM_DUMP_FILE = getFlagValue("--fromDumpFile");

async function confirmDeployedEnv(): Promise<void> {
	if (!DB_SYNC_TO) {
		console.error(
			`\n❌  ERROR: DB_SYNC_TO is not set — this script will not run against the remote database.`,
		);
		process.exit(1);
	}
	if (!DB_SYNC_FROM) {
		console.error(
			`\n❌  ERROR: DB_SYNC_FROM is not set — this script will not run against the remote database.`,
		);
		process.exit(1);
	}
	console.warn(
		`\n⚠️  WARNING\nDB_SYNC_FROM is "${DB_SYNC_FROM}"\nDB_SYNC_TO is "${DB_SYNC_TO}"\n\nThis script will run against these remote databases.`,
	);
	const proceed = await confirm({
		message: "Continue?",
		default: true,
	});
	if (!proceed) {
		console.log("Aborted.");
		process.exit(0);
	}
}

async function confirmDumpEnv(): Promise<void> {
	if (!DB_SYNC_FROM) {
		console.error(`\n❌  ERROR: DB_SYNC_FROM is not set — nothing to dump.`);
		process.exit(1);
	}
	console.log(`\nDumping from "${DB_SYNC_FROM}"`);
	const proceed = await confirm({
		message: "Continue?",
		default: true,
	});
	if (!proceed) {
		console.log("Aborted.");
		process.exit(0);
	}
}

async function confirmRestoreEnv(dumpFilePath: string): Promise<void> {
	if (!DB_SYNC_TO) {
		console.error(`\n❌  ERROR: DB_SYNC_TO is not set — nowhere to restore.`);
		process.exit(1);
	}
	console.warn(
		`\n⚠️  WARNING\nRestoring dump file "${dumpFilePath}"\ninto DB_SYNC_TO "${DB_SYNC_TO}"\n\nThis script will overwrite the target remote database.`,
	);
	const proceed = await confirm({
		message: "Continue?",
		default: true,
	});
	if (!proceed) {
		console.log("Aborted.");
		process.exit(0);
	}
}

function reportResult(result: {
	success: boolean;
	data?: string;
	message?: string;
}): void {
	if (!result.success) {
		console.error(`\n❌  ${result.message}`);
		process.exit(1);
	}
	console.log(`\n✅  ${result.data}`);
}

async function main() {
	if (ONLY_DUMP) {
		await confirmDumpEnv();
		// confirmDumpEnv exits when DB_SYNC_FROM is missing, so it's defined here.
		reportResult(await dumpDatabase(DB_SYNC_FROM as string));
		return;
	}

	if (FROM_DUMP_FILE) {
		await confirmRestoreEnv(FROM_DUMP_FILE);
		// confirmRestoreEnv exits when DB_SYNC_TO is missing, so it's defined here.
		reportResult(await restoreDatabase(DB_SYNC_TO as string, FROM_DUMP_FILE));
		return;
	}

	await confirmDeployedEnv();
	// confirmDeployedEnv exits when either is missing, so both are defined here.
	reportResult(
		await syncDatabase(DB_SYNC_FROM as string, DB_SYNC_TO as string, {
			saveDump: SAVE_DUMP,
		}),
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
