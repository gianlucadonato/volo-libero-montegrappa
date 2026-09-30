import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
	auth: { api: { getSession: vi.fn() } },
}));

vi.mock("next/headers", () => ({
	headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/public-images", () => ({
	uploadPublicImage: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from "@/app/api/news/images/route";
import { auth } from "@/auth";
import { NEWS_IMAGES_PREFIX } from "@/config/constants";
import { uploadPublicImage } from "@/lib/public-images";

const mockGetSession = auth.api.getSession as unknown as ReturnType<
	typeof vi.fn
>;
const mockUpload = uploadPublicImage as unknown as ReturnType<typeof vi.fn>;

function request(file?: File) {
	const formData = new FormData();
	if (file) formData.append("file", file);
	return new Request("http://localhost/api/news/images", {
		method: "POST",
		body: formData,
	});
}

const jpeg = (size = 10) =>
	new File([new Uint8Array(size)], "photo.jpg", { type: "image/jpeg" });

beforeEach(() => {
	vi.clearAllMocks();
	mockGetSession.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
	mockUpload.mockResolvedValue("https://bucket/news/images/x.jpg");
});

describe("POST /api/news/images", () => {
	it("returns 401 without a session", async () => {
		mockGetSession.mockResolvedValue(null);
		expect((await POST(request(jpeg()))).status).toBe(401);
	});

	it("returns 403 for non-admins", async () => {
		mockGetSession.mockResolvedValue({ user: { id: "u1", role: "MEMBER" } });
		expect((await POST(request(jpeg()))).status).toBe(403);
		expect(mockUpload).not.toHaveBeenCalled();
	});

	it("returns 400 without a file", async () => {
		expect((await POST(request())).status).toBe(400);
	});

	it("returns 415 for unsupported types", async () => {
		const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" });
		expect((await POST(request(svg))).status).toBe(415);
	});

	it("returns 413 for files over the limit", async () => {
		expect((await POST(request(jpeg(5 * 1024 * 1024 + 1)))).status).toBe(413);
		expect(mockUpload).not.toHaveBeenCalled();
	});

	it("uploads under the news prefix and returns the URL", async () => {
		const response = await POST(request(jpeg()));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			url: "https://bucket/news/images/x.jpg",
		});
		expect(mockUpload).toHaveBeenCalledWith(
			expect.any(Uint8Array),
			NEWS_IMAGES_PREFIX,
		);
	});
});
