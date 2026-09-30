import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({
	NEXT_PUBLIC_APP_URL: "https://www.vololiberomontegrappa.it",
	TELEGRAM_BOT_TOKEN: "123:abc" as string | undefined,
	TELEGRAM_CHAT_ID: "-1001234567890" as string | undefined,
	TELEGRAM_EVENTS_TOPIC_ID: 42 as number | undefined,
}));
const sendPhoto = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({ env }));
vi.mock("@/lib/logger", () => ({
	logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock("grammy", async (importOriginal) => {
	const actual = await importOriginal<typeof import("grammy")>();
	return {
		...actual,
		Api: class {
			sendPhoto = sendPhoto;
		},
	};
});

import { InputFile } from "grammy";
import { logger } from "@/lib/logger";
import { announceEvent } from "@/lib/telegram";

const event = {
	id: "evt1",
	title: "Befana Cup",
	description: "<p>Ciao</p>",
	eventDate: new Date("2025-01-06T00:00:00.000Z"),
	isMemberOnly: false,
	imageUrl:
		"https://vlm-xc-public.s3.eu-central-1.amazonaws.com/events/covers/a.jpg",
};

beforeEach(() => {
	vi.clearAllMocks();
	sendPhoto.mockResolvedValue({ message_id: 7 });
	env.TELEGRAM_BOT_TOKEN = "123:abc";
});

describe("announceEvent", () => {
	it("posts the cover URL to the events topic with an HTML caption", async () => {
		await announceEvent(event);

		expect(sendPhoto).toHaveBeenCalledWith("-1001234567890", event.imageUrl, {
			message_thread_id: 42,
			caption: expect.stringContaining(
				'<a href="https://www.vololiberomontegrappa.it/events/evt1">',
			),
			parse_mode: "HTML",
		});
	});

	it("uploads legacy inline covers as a file", async () => {
		await announceEvent({ ...event, imageUrl: "data:image/png;base64,AAAA" });
		expect(sendPhoto.mock.calls[0][1]).toBeInstanceOf(InputFile);
	});

	it("falls back to the default cover", async () => {
		await announceEvent({ ...event, imageUrl: null });
		expect(sendPhoto.mock.calls[0][1]).toBeInstanceOf(InputFile);
	});

	it("does nothing when Telegram is not configured", async () => {
		env.TELEGRAM_BOT_TOKEN = undefined;
		await announceEvent(event);
		expect(sendPhoto).not.toHaveBeenCalled();
	});

	it("logs instead of throwing when Telegram fails", async () => {
		sendPhoto.mockRejectedValue(
			new Error("Bad Request: message thread not found"),
		);
		await expect(announceEvent(event)).resolves.toBeUndefined();
		expect(logger.error).toHaveBeenCalledWith(
			{ eventId: "evt1", reason: "Bad Request: message thread not found" },
			"Failed to announce event on Telegram",
		);
	});
});
