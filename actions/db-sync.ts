import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
	type ConnectionOptions,
	FormatEnum,
	pgDump,
	pgRestore,
} from "pg-dump-restore";

type SyncDatabaseOptions = {
	/**
	 * Keep the dump file in the current working directory instead of a temporary
	 * folder that is deleted afterwards. Useful for inspecting or reusing the dump.
	 */
	saveDump?: boolean;
};

/**
 * Copies the full contents of one PostgreSQL database into another.
 *
 * Both `dbFrom` and `dbTo` are libpq connection URLs, e.g.
 * `postgresql://user:password@host:5432/database`.
 */
export async function syncDatabase(
	dbFrom: string,
	dbTo: string,
	{ saveDump = false }: SyncDatabaseOptions = {},
) {
	let tempDir: string | undefined;
	let restoreListPath: string | undefined;

	try {
		let dumpDir: string;
		if (saveDump) {
			dumpDir = process.cwd();
		} else {
			tempDir = await mkdtemp(join(tmpdir(), "db-sync-"));
			dumpDir = tempDir;
		}
		const dumpPath = join(dumpDir, "dump.pgdump");
		restoreListPath = join(dumpDir, "dump.list");

		const connectionOptionsFrom = getConnectionOptions(dbFrom);
		const connectionOptionsTo = getConnectionOptions(dbTo);

		console.log(
			`Starting database dump from ${connectionOptionsFrom.host}/${connectionOptionsFrom.database}...`,
		);
		await dumpDb(connectionOptionsFrom, dumpPath);
		if (saveDump) {
			console.log(`Dump saved to ${dumpPath}`);
		}

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
		if (tempDir) {
			// Temp mode: remove the whole scratch dir (dump + list file).
			await rm(tempDir, { recursive: true, force: true });
		} else if (restoreListPath) {
			// saveDump mode: keep the dump, drop the intermediate restore list.
			await rm(restoreListPath, { force: true });
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

/**
 * Dumps a PostgreSQL database to `dump.pgdump` in the current working directory,
 * without restoring it anywhere.
 *
 * `dbFrom` is a libpq connection URL, e.g.
 * `postgresql://user:password@host:5432/database`.
 */
export async function dumpDatabase(dbFrom: string) {
	try {
		const dumpPath = join(process.cwd(), "dump.pgdump");
		const connectionOptions = getConnectionOptions(dbFrom);

		console.log(
			`Starting database dump from ${connectionOptions.host}/${connectionOptions.database}...`,
		);
		await dumpDb(connectionOptions, dumpPath);

		return {
			success: true,
			data: `Database dump from ${connectionOptions.database} saved to ${dumpPath}.`,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("Error during database dump:", errorMessage);
		return {
			success: false,
			message: `Database dump failed: ${errorMessage}`,
		};
	}
}

/**
 * Restores a previously exported dump file into a PostgreSQL database, without
 * dumping from a source first.
 *
 * `dbTo` is a libpq connection URL; `dumpFilePath` points at a custom-format
 * dump produced by `dumpDatabase` or `syncDatabase` with `saveDump`.
 */
export async function restoreDatabase(dbTo: string, dumpFilePath: string) {
	let tempDir: string | undefined;

	try {
		const dumpPath = resolve(dumpFilePath);
		try {
			await stat(dumpPath);
		} catch {
			throw new Error(`Dump file not found or not readable at ${dumpPath}`);
		}

		// The restore only needs a scratch location for the intermediate list file.
		tempDir = await mkdtemp(join(tmpdir(), "db-sync-"));
		const restoreListPath = join(tempDir, "dump.list");
		const connectionOptions = getConnectionOptions(dbTo);

		console.log(
			`Starting database restore to ${connectionOptions.host}/${connectionOptions.database}...`,
		);
		await restoreDb(connectionOptions, dumpPath, restoreListPath);

		return {
			success: true,
			data: `Database restore from ${dumpPath} to ${connectionOptions.database} completed successfully.`,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("Error during database restore:", errorMessage);
		return {
			success: false,
			message: `Database restore failed: ${errorMessage}`,
		};
	} finally {
		if (tempDir) {
			await rm(tempDir, { recursive: true, force: true });
		}
	}
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
