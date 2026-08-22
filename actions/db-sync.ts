import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	type ConnectionOptions,
	FormatEnum,
	pgDump,
	pgRestore,
} from "pg-dump-restore";

/**
 * Copies the full contents of one PostgreSQL database into another.
 *
 * Both `dbFrom` and `dbTo` are libpq connection URLs, e.g.
 * `postgresql://user:password@host:5432/database`.
 */
export async function syncDatabase(dbFrom: string, dbTo: string) {
	let syncTempDir: string | undefined;

	try {
		syncTempDir = await mkdtemp(join(tmpdir(), "db-sync-"));
		const dumpPath = join(syncTempDir, "dump.pgdump");
		const restoreListPath = join(syncTempDir, "dump.list");

		const connectionOptionsFrom = getConnectionOptions(dbFrom);
		const connectionOptionsTo = getConnectionOptions(dbTo);

		console.log(
			`Starting database dump from ${connectionOptionsFrom.host}/${connectionOptionsFrom.database}...`,
		);
		await dumpDb(connectionOptionsFrom, dumpPath);

		console.log(
			`Starting database restore to ${connectionOptionsTo.host}/${connectionOptionsTo.database}...`,
		);
		await restoreDb(connectionOptionsTo, dumpPath, restoreListPath);

		return {
			success: true,
			data: `Database sync from ${connectionOptionsFrom.database} to ${connectionOptionsTo.database} completed successfully.`,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("Error during database sync:", errorMessage);
		return {
			success: false,
			message: `Database sync failed: ${errorMessage}`,
		};
	} finally {
		if (syncTempDir) {
			await rm(syncTempDir, { recursive: true, force: true });
		}
	}
}

/**
 * Parses a libpq connection URL (e.g. `postgresql://user:pwd@host:5432/db`)
 * into the `ConnectionOptions` shape expected by `pg-dump-restore`.
 */
function getConnectionOptions(connectionUrl: string): ConnectionOptions {
	let url: URL;
	try {
		url = new URL(connectionUrl);
	} catch {
		throw new Error(
			`Invalid PostgreSQL connection URL. Expected something like "postgresql://user:password@host:5432/database".`,
		);
	}

	if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
		throw new Error(
			`Unsupported protocol "${url.protocol}" — expected "postgresql://" or "postgres://".`,
		);
	}

	// `URL` keeps userinfo and path percent-encoded; decode them since
	// pg-dump-restore re-encodes the password itself.
	const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
	if (!database) {
		throw new Error("Connection URL is missing a database name.");
	}
	if (!url.username) {
		throw new Error("Connection URL is missing a username.");
	}

	const sslMode = url.searchParams.get("sslmode") ?? undefined;

	return {
		host: url.hostname,
		port: url.port ? Number.parseInt(url.port, 10) : 5432,
		database,
		username: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		// The lib forwards this straight to the PGSSLMODE env var, so any libpq
		// ssl mode ("require", "prefer", …) is accepted as-is.
		sslMode: sslMode as ConnectionOptions["sslMode"],
	};
}

async function dumpDb(connectionOptions: ConnectionOptions, dumpPath: string) {
	// Custom format is required so pg_restore can filter the archive with a list file.
	const { stderr } = await pgDump(connectionOptions, {
		filePath: dumpPath,
		format: FormatEnum.Custom,
		noOwner: true,
		noAcl: true,
	});
	// pg_dump prints progress/notices to stderr even on success; a real failure
	// rejects the promise instead.
	if (stderr) {
		console.warn("pg_dump notices:", stderr);
	}
	console.log("Database dump completed successfully.");
}

async function restoreDb(
	connectionOptions: ConnectionOptions,
	dumpPath: string,
	restoreListPath: string,
) {
	console.log("[restore] Creating filtered restore list...");
	await createFilteredRestoreList(connectionOptions, dumpPath, restoreListPath);
	console.log("[restore] Filtered restore list created.");

	const fileStats = await stat(dumpPath);
	const sizeMB = (fileStats.size / 1024 / 1024).toFixed(1);
	console.log(`[restore] Running pg_restore (dump size: ${sizeMB} MB)...`);

	const startTime = Date.now();
	const progressInterval = setInterval(() => {
		const elapsed = Math.round((Date.now() - startTime) / 1000);
		console.log(`[restore] Still restoring... (${elapsed}s elapsed)`);
	}, 10_000);

	try {
		const { stderr } = await pgRestore(connectionOptions, {
			filePath: dumpPath,
			clean: true,
			ifExists: true,
			useListFile: restoreListPath,
			noOwner: true,
			noAcl: true,
			verbose: true,
		});
		const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
		// pg_restore reports its verbose progress on stderr; surface it as notices.
		if (stderr) {
			console.warn("pg_restore notices:", stderr);
		}
		console.log(
			`[restore] Database restore completed successfully in ${elapsed}s`,
		);
	} finally {
		clearInterval(progressInterval);
	}
}

/**
 * Builds a pg_restore list file from the dump, dropping entries that commonly
 * fail against a managed target (extension operations and database-level
 * properties), then writes it to `restoreListPath` for `--use-list`.
 */
async function createFilteredRestoreList(
	connectionOptions: ConnectionOptions,
	dumpPath: string,
	restoreListPath: string,
) {
	const { stdout, stderr } = await pgRestore(connectionOptions, {
		filePath: dumpPath,
		list: true,
	});

	if (stderr) {
		console.warn("Warning while generating restore list:", stderr);
	}

	const filteredRestoreList = stdout
		.split("\n")
		.filter((line) => {
			const normalizedLine = line.toLowerCase();
			const isExtensionLine = normalizedLine.includes("extension");
			const isDatabasePropertiesLine =
				normalizedLine.includes("database") &&
				normalizedLine.includes("properties");

			return !isExtensionLine && !isDatabasePropertiesLine;
		})
		.join("\n");

	await writeFile(restoreListPath, filteredRestoreList, "utf-8");
}
