import { render } from "@react-email/components";
import {
	VerifyEmail,
	type VerifyEmailLanguage,
} from "@/emails/template/verify-email";
import { sendMail } from "@/lib/sendMail";

const SUBJECT: Record<VerifyEmailLanguage, string> = {
	it: "Conferma la tua email - Volo Libero Montegrappa",
	en: "Confirm your email - Volo Libero Montegrappa",
};

/**
 * Picks the email language from the visitor's `NEXT_LOCALE` cookie: a new user
 * has no profile yet to read a country from. Italian by default, English for
 * any other locale the visitor picked.
 */
export function verifyEmailLanguage(request?: Request): VerifyEmailLanguage {
	const cookie = request?.headers.get("cookie") ?? "";
	const locale = /(?:^|;\s*)NEXT_LOCALE=([^;]+)/.exec(cookie)?.[1];
	return !locale || locale === "it" ? "it" : "en";
}

export async function sendVerifyEmail({
	email,
	firstName,
	url,
	language,
}: {
	email: string;
	firstName: string;
	url: string;
	language: VerifyEmailLanguage;
}) {
	const element = VerifyEmail({ firstName, url, language });
	const html = await render(element);
	const text = await render(element, { plainText: true });
	await sendMail({
		sendTo: email,
		subject: SUBJECT[language],
		text,
		html,
	});
}
