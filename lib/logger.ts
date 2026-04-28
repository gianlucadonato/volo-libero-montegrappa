// Server-only: do NOT import this in client components or edge runtime files.
import pino from "pino";

const APP_NAME = process.env.LOG_APP_NAME ?? "volo-libero-montegrappa";
const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const IS_DEV = process.env.VLM_ENV !== "production";
const LOKI_URL = process.env.LOKI_URL;

type PinoLogger = ReturnType<typeof pino>;

const globalForLogger = globalThis as typeof globalThis & {
	_logger?: PinoLogger;
};

function createLogger(): PinoLogger {
	const base = { app: APP_NAME };

	if (IS_DEV) {
		return pino({
			level: LOG_LEVEL,
			base,
			transport: {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "HH:MM:ss.l",
					ignore: "pid,hostname",
				},
			},
		});
	}

	if (LOKI_URL) {
		return pino(
			{ level: LOG_LEVEL, base },
			pino.transport({
				target: "pino-loki",
				options: {
					host: LOKI_URL,
					labels: { app: APP_NAME, env: process.env.VLM_ENV },
					batching: true,
					interval: 5,
					silenceErrors: false,
				},
			}),
		);
	}

	// Production fallback without Loki: structured JSON to stdout
	return pino({ level: LOG_LEVEL, base });
}

export const logger = globalForLogger._logger ?? createLogger();

// Preserve singleton across hot-reloads in dev
if (IS_DEV) {
	globalForLogger._logger = logger;
}

export type { PinoLogger };
