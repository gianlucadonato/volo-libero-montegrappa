export type Locale = (typeof locales)[number];

export const locales = ["it", "en", "de"] as const;
export const defaultLocale: Locale = "it";

/** Flag shown next to each language: react-flagpack loads it from
 * public/flags/{size}/{code}.svg, so every code needs its SVGs there. */
export const localeFlags: Record<Locale, string> = {
	it: "IT",
	en: "EN",
	de: "DE",
};
