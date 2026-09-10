// Server-only: do NOT import this in client components or edge runtime files.
import { context, isSpanContextValid, trace } from "@opentelemetry/api";
import { type AnyValue, logs, SeverityNumber } from "@opentelemetry/api-logs";
import pino from "pino";

const APP_NAME = process.env.LOG_APP_NAME ?? "volo-libero-montegrappa";
const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const IS_DEV = process.env.VLM_ENV !== "production";
const OTEL_ENABLED = process.env.OTEL_EXPORTER_ENABLED === "true";

type PinoLogger = ReturnType<typeof pino>;

const globalForLogger = globalThis as typeof globalThis & {
	_logger?: PinoLogger;
};

// pino's numeric levels mapped onto the OpenTelemetry severity scale.
const OTEL_SEVERITY: Record<number, [SeverityNumber, string]> = {
	10: [SeverityNumber.TRACE, "trace"],
	20: [SeverityNumber.DEBUG, "debug"],
	30: [SeverityNumber.INFO, "info"],
	40: [SeverityNumber.WARN, "warn"],
	50: [SeverityNumber.ERROR, "error"],
	60: [SeverityNumber.FATAL, "fatal"],
};

/**
 * A pino destination that re-emits every record through the OpenTelemetry Logs
 * API, which instrumentation.ts exports to PostHog.
 *
 * Why not @opentelemetry/instrumentation-pino: that package bridges pino by
 * monkey-patching the module as it is required. Next bundles our server code
 * with webpack and loads `instrumentation.ts` in its own bundle, so pino is
 * already resolved and cached by the time the patch is installed — the hook
 * never fires and records reach stdout only. Emitting explicitly here does not
 * depend on module-load ordering, so it survives bundling.
 */
function createOtelStream() {
	return {
		write(line: string) {
			let record: Record<string, unknown>;
			try {
				record = JSON.parse(line);
			} catch {
				// A record we cannot parse is not worth crashing a request over.
				return;
			}

			const { level, time, msg, ...attributes } = record;
			const [severityNumber, severityText] = OTEL_SEVERITY[level as number] ?? [
				SeverityNumber.INFO,
				"info",
			];

			logs.getLogger(APP_NAME).emit({
				severityNumber,
				severityText,
				body: typeof msg === "string" ? msg : undefined,
				timestamp: typeof time === "number" ? time : undefined,
				attributes: attributes as Record<string, AnyValue>,
			});
		},
	};
}

/**
 * Stamps the active trace onto every record, so a log line in PostHog links
 * back to the request span that produced it.
 */
function otelMixin() {
	const span = trace.getSpan(context.active());
	if (!span) return {};
	const spanContext = span.spanContext();
	if (!isSpanContextValid(spanContext)) return {};
	return { trace_id: spanContext.traceId, span_id: spanContext.spanId };
}

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

	// Structured JSON to stdout, so `docker logs` keeps working on its own.
	if (!OTEL_ENABLED) {
		return pino({ level: LOG_LEVEL, base });
	}

	// Fan out to stdout and to PostHog Logs. Level 0 on both: pino has already
	// applied LOG_LEVEL by the time a record reaches a stream.
	return pino(
		{ level: LOG_LEVEL, base, mixin: otelMixin },
		pino.multistream([
			{ level: 0, stream: pino.destination(1) },
			{ level: 0, stream: createOtelStream() },
		]),
	);
}

export const logger = globalForLogger._logger ?? createLogger();

// Preserve singleton across hot-reloads in dev
if (IS_DEV) {
	globalForLogger._logger = logger;
}

export type { PinoLogger };
