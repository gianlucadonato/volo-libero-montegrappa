import { registerOTel } from "@vercel/otel";

export function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		registerOTel({
			serviceName: process.env.LOG_APP_NAME ?? "volo-libero-montegrappa",
		});
	}
}
