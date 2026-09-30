"use server";

import { cookies } from "next/headers";
import { defaultLocale, type Locale, locales } from "@/i18n/config";

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
const COOKIE_NAME = "NEXT_LOCALE";

export async function getUserLocale(): Promise<Locale> {
	const cookieStore = await cookies();
	const value = cookieStore.get(COOKIE_NAME)?.value;
	// An unknown value (stale or hand-edited cookie) would fail the messages import.
	return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export async function setUserLocale(locale: Locale) {
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, locale);
}
