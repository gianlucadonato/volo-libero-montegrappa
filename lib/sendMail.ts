"use server";

import { Resend } from "resend";
import { env } from "@/env";
import { logger } from "@/lib/logger";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendMail({
	from,
	sendTo,
	subject,
	text,
	html = "",
}: {
	from?: string;
	sendTo: string;
	subject: string;
	text: string;
	html?: string;
}) {
	const emailTo = env.VLM_ENV !== "production" ? "gian.dnt@gmail.com" : sendTo;
	const sender = from || env.EMAIL_FROM;

	const info = await resend.emails.send({
		from: sender,
		to: emailTo,
		subject,
		text,
		html,
	});

	// The Resend SDK does not throw on API errors: it returns them in `error`.
	// Log them here, otherwise a rejected send looks like a successful one.
	if (info.error) {
		logger.error(
			{ resendError: info.error, from: sender, to: emailTo, subject },
			"Resend rejected the email",
		);
	} else {
		logger.info(
			{ resendId: info.data?.id, from: sender, to: emailTo, subject },
			"Email sent",
		);
	}
	return info;
}
