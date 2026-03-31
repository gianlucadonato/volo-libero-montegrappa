import { metrics } from "@/lib/metrics";

export async function GET(req: Request) {
	const token = process.env.METRICS_TOKEN;
	if (token) {
		const auth = req.headers.get("authorization");
		if (!auth || auth !== `Bearer ${token}`) {
			return new Response("Unauthorized", { status: 401 });
		}
	}

	const metricsText = await metrics.registry.metrics();
	return new Response(metricsText, {
		headers: { "Content-Type": metrics.registry.contentType },
	});
}
