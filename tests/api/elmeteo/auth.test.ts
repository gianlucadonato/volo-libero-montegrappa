import { beforeEach, describe, expect, it, vi } from "vitest";

const validToken = "c2c52177-92e0-4852-a425-e9f521e51d5a";

vi.mock("@/env", () => ({
	env: { ELMETEO_API_TOKEN: validToken },
}));

const createReport = vi.fn();
vi.mock("@/lib/prisma", () => ({
	prisma: {
		report: {
			create: (...args: unknown[]) => createReport(...args),
			findFirst: vi.fn(),
		},
	},
}));

vi.mock("@/lib/elmeteo", () => ({ cleanupElmeteoBucket: vi.fn() }));
vi.mock("@/lib/elmeteo-images", () => ({ pruneElmeteoCache: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
vi.mock("next/server", () => ({ after: vi.fn() }));

const authorizationHeader = vi.fn<() => string | null>(() => null);
vi.mock("next/headers", () => ({
	headers: async () => ({ get: () => authorizationHeader() }),
}));

const { POST } = await import("@/app/api/elmeteo/route");

function postReport() {
	return POST(
		new Request("https://example.test/api/elmeteo", {
			method: "POST",
			body: JSON.stringify({
				destFolder: "2026-09-09T16:37:34.686",
				amazonS3: { startTime: "2026-09-09T16:37:34.686Z", endTime: null },
				ftp: { startTime: "2026-09-09T16:37:34.686Z", endTime: null },
				totalFiles: 833,
				totalUploadedFiles: 833,
				totalBytes: 1,
				startTime: "2026-09-09T16:37:34.686Z",
			}),
		}),
	);
}

describe("POST /api/elmeteo authentication", () => {
	beforeEach(() => {
		createReport.mockReset();
		authorizationHeader.mockReset();
	});

	it("rejects a request without an Authorization header", async () => {
		authorizationHeader.mockReturnValue(null);
		expect((await postReport()).status).toBe(401);
		expect(createReport).not.toHaveBeenCalled();
	});

	it("rejects a wrong token of the same length", async () => {
		// Same length exercises the constant-time comparison rather than the
		// length short-circuit.
		authorizationHeader.mockReturnValue(
			`Bearer ${"a".repeat(validToken.length)}`,
		);
		expect((await postReport()).status).toBe(401);
		expect(createReport).not.toHaveBeenCalled();
	});

	it("rejects a token that is merely a prefix of the valid one", async () => {
		authorizationHeader.mockReturnValue(`Bearer ${validToken.slice(0, -1)}`);
		expect((await postReport()).status).toBe(401);
		expect(createReport).not.toHaveBeenCalled();
	});

	it("rejects a bare Authorization header with no token", async () => {
		authorizationHeader.mockReturnValue("Bearer");
		expect((await postReport()).status).toBe(401);
		expect(createReport).not.toHaveBeenCalled();
	});

	it("accepts the configured token and stores the report", async () => {
		authorizationHeader.mockReturnValue(`Bearer ${validToken}`);
		const response = await postReport();
		expect(response.status).toBe(200);
		expect(createReport).toHaveBeenCalledOnce();
	});
});
