"use server";

import { Resend } from "resend";
import { env } from "@/env";

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
	const emailTo =
		env.VERCEL_ENV !== "production" ? "gian.dnt@gmail.com" : sendTo;

	const info = await resend.emails.send({
		from: from || env.EMAIL_FROM,
		to: emailTo,
		subject,
		text,
		html,
	});
	return info;
}
