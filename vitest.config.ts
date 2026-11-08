import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Dates are formatted in local time, so pin the club's timezone: the suite
// otherwise fails on a machine set to another one (e.g. 17:30 UTC is already
// the next day in Australia). Set before the workers spawn, which inherit it.
process.env.TZ = "Europe/Rome";

export default defineConfig({
	resolve: {
		alias: {
			"@": resolve(__dirname, "."),
		},
	},
	test: {
		globals: true,
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});
