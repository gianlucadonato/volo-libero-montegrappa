import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Api, InputFile } from "grammy";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import {
	buildEventCaption,
	type EventCaptionInput,
} from "@/lib/telegram-caption";

let api: Api | undefined;

function getTelegramConfig() {
	if (
		!env.TELEGRAM_BOT_TOKEN ||
		!env.TELEGRAM_CHAT_ID ||
		!env.TELEGRAM_EVENTS_TOPIC_ID
	) {
		return null;
	}
	api ??= new Api(env.TELEGRAM_BOT_TOKEN);
	return {
		api,
		chatId: env.TELEGRAM_CHAT_ID,
		topicId: env.TELEGRAM_EVENTS_TOPIC_ID,
	};
}

export function isTelegramConfigured(): boolean {
	return getTelegramConfig() !== null;
}

const DEFAULT_COVER_PATH = path.join(
	process.cwd(),
	"public",
	"events",
	"default.jpg",
);

/**
 * The photo to send: a public URL is fetched by Telegram itself, while inline
 * data URLs (legacy covers) and the bundled default are uploaded as files.
 */
async function resolvePhoto(
	imageUrl: string | null | undefined,
): Promise<InputFile | string> {
	if (imageUrl?.startsWith("https://")) return imageUrl;

	const match = imageUrl?.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i);
	if (match) return new InputFile(Buffer.from(match[1], "base64"), "cover.jpg");

	return new InputFile(await readFile(DEFAULT_COVER_PATH), "cover.jpg");
}

export type AnnounceableEvent = EventCaptionInput & {
	imageUrl?: string | null;
};

/**
 * Posts a new event to the events topic of the club's Telegram group.
 *
 * Never throws: the event is already saved when this runs, and a Telegram
 * outage must not surface as a failed save. Failures are logged instead.
 */
export async function announceEvent(event: AnnounceableEvent): Promise<void> {
	try {
		const config = getTelegramConfig();
		if (!config) {
			logger.info(
				{ eventId: event.id },
				"Telegram is not configured, skipping event announcement",
			);
			return;
		}

		const eventUrl = new URL(
			`/events/${event.id}`,
			env.NEXT_PUBLIC_APP_URL,
		).toString();
		const message = await config.api.sendPhoto(
			config.chatId,
			await resolvePhoto(event.imageUrl),
			{
				message_thread_id: config.topicId,
				caption: buildEventCaption(event, eventUrl),
				parse_mode: "HTML",
			},
		);
		logger.info(
			{ eventId: event.id, messageId: message.message_id },
			"Event announced on Telegram",
		);
	} catch (error) {
		// The message is read explicitly: pino serialises a bare Error to {}.
		logger.error(
			{
				eventId: event.id,
				reason: error instanceof Error ? error.message : String(error),
			},
			"Failed to announce event on Telegram",
		);
	}
}
