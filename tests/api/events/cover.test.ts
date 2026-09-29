import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("next/headers", () => ({
	headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/event-covers", () => ({
	uploadEventCover: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from "@/app/api/events/cover/route";
import { auth } from "@/auth";
import { uploadEventCover } from "@/lib/event-covers";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
	typeof vi.fn
>;
const mockUpload = uploadEventCover as unknown as ReturnType<typeof vi.fn>;

function request(file?: File) {
	const formData = new FormData();
	if (file) formData.append("file", file);
	return new Request("http://localhost/api/events/cover", {
		method: "POST",
		body: formData,
	});
}

const jpeg = (size = 10) =>
	new File([new Uint8Array(size)], "cover.jpg", { type: "image/jpeg" });

beforeEach(() => {
	vi.clearAllMocks();
	mockGetSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
	mockUpload.mockResolvedValue("https://bucket/events/covers/x.jpg");
});

describe("POST /api/events/cover", () => {
	it("returns 401 without a session", async () => {
		mockGetSession.mockResolvedValue(null);
		expect((await POST(request(jpeg()))).status).toBe(401);
	});

	it("returns 403 for non-admins", async () => {
		mockGetSession.mockResolvedValue({ user: { id: "u1", role: "USER" } });
		expect((await POST(request(jpeg()))).status).toBe(403);
		expect(mockUpload).not.toHaveBeenCalled();
	});

	it("returns 400 without a file", async () => {
		expect((await POST(request())).status).toBe(400);
	});

	it("returns 415 for unsupported types", async () => {
		const gif = new File([new Uint8Array(10)], "a.gif", { type: "image/gif" });
		expect((await POST(request(gif))).status).toBe(415);
	});

	it("returns 413 for files over the limit", async () => {
		expect((await POST(request(jpeg(5 * 1024 * 1024 + 1)))).status).toBe(413);
		expect(mockUpload).not.toHaveBeenCalled();
	});

	it("uploads the cover and returns its URL", async () => {
		const response = await POST(request(jpeg()));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			url: "https://bucket/events/covers/x.jpg",
		});
		expect(mockUpload).toHaveBeenCalledWith(expect.any(Uint8Array));
	});
});
