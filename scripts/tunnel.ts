/**
 * Reaches a database that is only visible inside the Dokploy network, through SSH.
 *
 * A URL whose host is `ssh:<user@server>/<db-host>[:port]` is opened as a tunnel:
 * a throwaway socat container on the server's dokploy-network (published on the
 * server's 127.0.0.1 only), plus a local port forwarded to it over SSH. close()
 * removes both. The database itself is never exposed to the internet.
 *   postgresql://postgres:<pwd>@ssh:root@168.119.245.243/<db-host>:5432/vlm-db
 * `<db-host>` is the "Internal Host" shown on the database's page in Dokploy.
 * Plain URLs pass through unchanged.
 *
 * Requires key-based SSH access to the server (the commands run with BatchMode,
 * so a password prompt fails instead of hanging).
 */
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import net from "node:net";

export type Target = {
	url: string;
	label: string;
	remote: boolean;
	close: () => Promise<void>;
};

const SOCAT_IMAGE = "alpine/socat:1.8.0.3";

/** Hides the password when printing a URL. */
export function redact(url: string): string {
	return url.replace(/(\/\/[^:/@]+:)[^@]*@/, "$1***@");
}

function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const srv = net.createServer();
		srv.listen(0, "127.0.0.1", () => {
			const { port } = srv.address() as net.AddressInfo;
			srv.close(() => resolve(port));
		});
		srv.on("error", reject);
	});
}

async function waitForPort(port: number, ms = 15000): Promise<void> {
	const until = Date.now() + ms;
	while (Date.now() < until) {
		const ok = await new Promise<boolean>((resolve) => {
			const socket = net.connect(port, "127.0.0.1", () => {
				socket.end();
				resolve(true);
			});
			socket.on("error", () => resolve(false));
		});
		if (ok) return;
		await new Promise((resolve) => setTimeout(resolve, 300));
	}
	throw new Error(`tunnel on port ${port} did not come up`);
}

/** Resolves an `ssh:` URL into a local one through a tunnel; plain URLs pass through. */
export async function openTarget(raw: string, label: string): Promise<Target> {
	const match = raw.match(
		/^(postgres(?:ql)?:\/\/[^@]+@)ssh:([^/]+)\/([^:/]+)(?::(\d+))?(\/.*)$/,
	);
	if (!match) {
		const host = new URL(raw).hostname;
		return {
			url: raw,
			label,
			remote: !["localhost", "127.0.0.1", "::1"].includes(host),
			close: async () => {},
		};
	}
	const [, auth, sshHost, dbHost, dbPort = "5432", rest] = match;
	const remotePort = 20000 + Math.floor(Math.random() * 20000);
	const name = `vlm-tunnel-${process.pid}-${remotePort}`;

	console.log(`  ↳ ${label}: starting tunnel to ${dbHost} via ${sshHost}`);
	const start = spawnSync(
		"ssh",
		[
			"-o",
			"BatchMode=yes",
			sshHost,
			`docker run -d --rm --name ${name} --network dokploy-network -p 127.0.0.1:${remotePort}:5432 ` +
				`${SOCAT_IMAGE} TCP-LISTEN:5432,fork,reuseaddr TCP:${dbHost}:${dbPort}`,
		],
		{ encoding: "utf8" },
	);
	if (start.status !== 0) {
		throw new Error(
			`could not start the tunnel container: ${start.stderr.trim()}`,
		);
	}

	const localPort = await freePort();
	const tunnel: ChildProcess = spawn(
		"ssh",
		[
			"-o",
			"BatchMode=yes",
			"-N",
			"-L",
			`${localPort}:127.0.0.1:${remotePort}`,
			sshHost,
		],
		{ stdio: "ignore" },
	);
	const close = async () => {
		tunnel.kill();
		spawnSync("ssh", ["-o", "BatchMode=yes", sshHost, `docker rm -f ${name}`], {
			stdio: "ignore",
		});
	};
	try {
		await waitForPort(localPort);
	} catch (error) {
		await close();
		throw error;
	}
	// Whatever runs next only sees the local end, so name it: logs printing
	// 127.0.0.1 from here on are talking to the remote database.
	console.log(
		`  ↳ ${label}: tunnel open, 127.0.0.1:${localPort} → ${dbHost}:${dbPort}`,
	);
	return {
		url: `${auth}127.0.0.1:${localPort}${rest}`,
		label,
		remote: true,
		close,
	};
}
