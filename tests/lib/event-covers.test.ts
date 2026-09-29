import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
	env: { AWS_S3_XC_PUBLIC_BUCKET: "vlm-xc-public" },
}));

vi.mock("@/lib/s3", () => ({
	putObject: vi.fn(),
}));

import { EVENT_COVERS_BASE_URL } from "@/config/constants";
import {
	decodeImageDataUrl,
	eventCoverMaxWidth,
	processEventCover,
	uploadEventCover,
} from "@/lib/event-covers";
import { putObject } from "@/lib/s3";
import { EventSchema } from "@/schemas";

const mockPutObject = putObject as unknown as ReturnType<typeof vi.fn>;

function png(width: number, height: number) {
	return sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 255, g: 0, b: 0, alpha: 0.5 },
		},
	})
		.png()
		.toBuffer();
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("decodeImageDataUrl", () => {
	it("decodes a base64 image data URL", async () => {
		const bytes = await png(4, 4);
		const decoded = decodeImageDataUrl(
			`data:image/png;base64,${bytes.toString("base64")}`,
		);
		expect(decoded?.equals(bytes)).toBe(true);
	});

	it("rejects anything that isn't an image data URL", () => {
		expect(decodeImageDataUrl("https://example.com/a.jpg")).toBeNull();
		expect(decodeImageDataUrl("data:text/plain;base64,aGk=")).toBeNull();
	});
});

describe("processEventCover", () => {
	it("re-encodes to JPEG and caps the width", async () => {
		const output = await processEventCover(await png(3000, 1500));
		const meta = await sharp(output).metadata();
		expect(meta.format).toBe("jpeg");
		expect(meta.width).toBe(eventCoverMaxWidth);
		expect(meta.height).toBe(800);
	});

	it("does not upscale small images", async () => {
		const meta = await sharp(
			await processEventCover(await png(400, 200)),
		).metadata();
		expect(meta.width).toBe(400);
	});
});

describe("uploadEventCover", () => {
	it("uploads a JPEG under the covers prefix and returns its public URL", async () => {
		const url = await uploadEventCover(await png(10, 10));

		expect(url).toMatch(
			new RegExp(`^${EVENT_COVERS_BASE_URL}[0-9a-f-]{36}\\.jpg$`),
		);
		expect(mockPutObject).toHaveBeenCalledWith(
			expect.objectContaining({
				bucket: "vlm-xc-public",
				objectKey: url.slice(url.indexOf("events/covers/")),
				contentType: "image/jpeg",
				cacheControl: "public, max-age=31536000, immutable",
			}),
		);
	});
});

describe("EventSchema.imageUrl", () => {
	const base = {
		title: "t",
		description: "d",
		eventDate: "2026-10-01",
		isMemberOnly: false,
	};

	it("accepts bucket covers and legacy data URLs", () => {
		for (const imageUrl of [
			`${EVENT_COVERS_BASE_URL}abc.jpg`,
			"data:image/png;base64,AAAA",
			undefined,
		]) {
			expect(EventSchema.safeParse({ ...base, imageUrl }).success).toBe(true);
		}
	});

	it("rejects arbitrary URLs", () => {
		expect(
			EventSchema.safeParse({ ...base, imageUrl: "https://evil.example/a.jpg" })
				.success,
		).toBe(false);
	});
});
