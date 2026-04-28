// Server-only: do NOT import this in client components or edge runtime files.
import {
	Counter,
	collectDefaultMetrics,
	Histogram,
	Registry,
} from "prom-client";

type Metrics = {
	registry: Registry;
	httpRequests: Counter<string>;
	httpDuration: Histogram<string>;
	stripeWebhookEvents: Counter<string>;
	stripeWebhookErrors: Counter<string>;
	paymentsCreated: Counter<string>;
};

const globalForMetrics = globalThis as typeof globalThis & {
	_metrics?: Metrics;
};

function createMetrics(): Metrics {
	const registry = new Registry();
	collectDefaultMetrics({ register: registry });

	const httpRequests = new Counter({
		name: "vlm_http_requests_total",
		help: "Total HTTP requests",
		labelNames: ["method", "route", "status"],
		registers: [registry],
	});

	const httpDuration = new Histogram({
		name: "vlm_http_request_duration_seconds",
		help: "HTTP request latency in seconds",
		labelNames: ["method", "route"],
		buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
		registers: [registry],
	});

	const stripeWebhookEvents = new Counter({
		name: "vlm_stripe_webhook_events_total",
		help: "Total Stripe webhook events received",
		labelNames: ["event_type"],
		registers: [registry],
	});

	const stripeWebhookErrors = new Counter({
		name: "vlm_stripe_webhook_errors_total",
		help: "Total Stripe webhook processing errors",
		registers: [registry],
	});

	const paymentsCreated = new Counter({
		name: "vlm_payments_created_total",
		help: "Total payments successfully created",
		registers: [registry],
	});

	return {
		registry,
		httpRequests,
		httpDuration,
		stripeWebhookEvents,
		stripeWebhookErrors,
		paymentsCreated,
	};
}

export const metrics = globalForMetrics._metrics ?? createMetrics();

// Preserve singleton across hot-reloads in dev
if (process.env.VLM_ENV !== "production") {
	globalForMetrics._metrics = metrics;
}
