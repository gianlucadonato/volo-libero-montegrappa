import { logs } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
	BatchLogRecordProcessor,
	LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { OTLPHttpProtoTraceExporter, registerOTel } from "@vercel/otel";

// Next loads this before the app boots, so it reads process.env directly rather
// than importing @/env: that module validates the whole server schema at import
// time, and this file also has to stay loadable from the edge runtime.
export function register() {
	if (process.env.NEXT_RUNTIME !== "nodejs") return;

	const serviceName = process.env.LOG_APP_NAME ?? "volo-libero-montegrappa";

	// Logs and traces go to PostHog's OTLP receiver on the same ingestion host
	// the browser SDK posts events to, authenticated with the same project
	// token. Exporting is opt-in: without it we still register the SDK so spans
	// exist in-process, they just aren't shipped anywhere.
	const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
	const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
	const enabled =
		process.env.OTEL_EXPORTER_ENABLED === "true" && !!host && !!token;

	if (!enabled) {
		registerOTel({ serviceName });
		return;
	}

	const headers = { Authorization: `Bearer ${token}` };
	const base = host.replace(/\/$/, "");

	registerOTel({
		serviceName,
		traceExporter: new OTLPHttpProtoTraceExporter({
			url: `${base}/i/v1/traces`,
			headers,
		}),
	});

	// Registered separately from registerOTel: it accepts logRecordProcessors but
	// never calls logs.setGlobalLoggerProvider, so records emitted through the
	// Logs API would go to the no-op provider. lib/logger.ts emits into this one.
	const loggerProvider = new LoggerProvider({
		resource: resourceFromAttributes({ "service.name": serviceName }),
		processors: [
			new BatchLogRecordProcessor({
				exporter: new OTLPLogExporter({ url: `${base}/i/v1/logs`, headers }),
			}),
		],
	});
	logs.setGlobalLoggerProvider(loggerProvider);
}
