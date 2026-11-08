/**
 * Runs a package script against the production database from your machine:
 *   pnpm prod tsx scripts/newXcEdition.ts
 *   pnpm prod db:deploy
 *   pnpm prod db:studio
 *
 * PROD_DATABASE_URL (in .env) uses the `ssh:` form of scripts/tunnel.ts, so the
 * database stays private: a tunnel is opened for the run and closed afterwards,
 * even if the script fails or is stopped with Ctrl+C.
 *   PROD_DATABASE_URL=postgresql://postgres:<pwd>@ssh:root@168.119.245.243/<db-host>:5432/vlm-db
 * The script gets DATABASE_URL pointed at the tunnel. Neither `tsx --env-file`
 * nor dotenv override a variable that is already set, so .env cannot put the
 * local DATABASE_URL back, and your local setup is untouched.
 *
 * Asks for confirmation first; --yes skips it (e.g. in a script you've already checked).
 */
import { spawn } from "node:child_process";
import { confirm } from "@inquirer/prompts";
import { openTarget, redact } from "./tunnel";

// The dev server and builds must never point at production; db:sync manages its
// own source and target; `prisma migrate dev` may offer to reset the database.
const BLOCKED = [
	"dev",
	"dev:turbo",
	"build",
	"start",
	"db:sync",
	"db:migrate",
	"prod",
];

const args = process.argv.slice(2);
const yes = args.includes("--yes");
const [script, ...rest] = args.filter((arg) => arg !== "--yes");
const fail = (message: string): never => {
	console.error(`\n✗ ${message}`);
	process.exit(1);
};

async function main() {
	if (!script) {
		fail(
			"Usage: pnpm prod <script> [args...]   e.g. pnpm prod tsx scripts/newXcEdition.ts",
		);
	}
	if (BLOCKED.includes(script)) {
		fail(`"${script}" can't run against production with pnpm prod`);
	}
	const url = process.env.PROD_DATABASE_URL;
	if (!url) {
		fail("PROD_DATABASE_URL is not set in .env (see the README)");
		return;
	}

	console.log(
		`\nScript: pnpm ${[script, ...rest].join(" ")}\nTarget: ${redact(url)}`,
	);
	// Ctrl+C or a closed stdin (no terminal) rejects the prompt: treat it as a no.
	const ok =
		yes ||
		(await confirm({
			message: "Run it against PRODUCTION?",
			default: false,
		}).catch(() => false));
	if (!ok) fail("aborted");

	const target = await openTarget(url, "production");
	// Ctrl+C reaches the child too. Outlive it, so the tunnel is still closed below.
	const ignore = () => {};
	process.on("SIGINT", ignore);
	process.on("SIGTERM", ignore);
	let code = 1;
	try {
		code = await new Promise<number>((resolve) => {
			const child = spawn("pnpm", ["run", script, ...rest], {
				stdio: "inherit",
				env: { ...process.env, DATABASE_URL: target.url },
			});
			child.on("exit", (c, signal) => resolve(c ?? (signal ? 1 : 0)));
			child.on("error", () => resolve(1));
		});
	} finally {
		await target.close();
	}
	process.exit(code);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
