import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

export async function GET() {
	const route = "/api/observability/test";
	const requestId = crypto.randomUUID();
	const endTimer = metrics.httpDuration.startTimer({ method: "GET", route });

	const log = logger.child({ requestId, route, source: "observability-test" });

	log.info(
		{
			event: "observability_test_info",
			note: "Info log for Loki ingestion verification",
		},
		"observability test info",
	);

	log.warn(
		{
			event: "observability_test_warning",
			note: "Warning log for Loki ingestion verification",
		},
		"observability test warning",
	);

	log.error(
		{
			event: "observability_test_error",
			err: new Error("Intentional test error for Loki pipeline check"),
		},
		"observability test error",
	);

	endTimer();
	metrics.httpRequests.inc({ method: "GET", route, status: "200" });

	return Response.json({
		ok: true,
		requestId,
		message: "Test logs emitted",
		lokiQueryHint: `{requestId="${requestId}"} or {app="volo-libero-montegrappa"}`,
	});
}
