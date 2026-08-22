import { confirm } from "@inquirer/prompts";
import { syncDatabase } from "@/actions/db-sync";

const DB_SYNC_FROM = process.env.DB_SYNC_FROM;
const DB_SYNC_TO = process.env.DB_SYNC_TO;

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

async function main() {
	await confirmDeployedEnv();
	// confirmDeployedEnv exits when either is missing, so both are defined here.
	const result = await syncDatabase(
		DB_SYNC_FROM as string,
		DB_SYNC_TO as string,
	);
	if (!result.success) {
		console.error(`\n❌  ${result.message}`);
		process.exit(1);
	}
	console.log(`\n✅  ${result.data}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
