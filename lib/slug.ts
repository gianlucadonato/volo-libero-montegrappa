/**
 * Turns a title into a URL slug: lowercase ASCII words joined by dashes, with
 * accents folded ("Città" -> "citta") and emoji and punctuation dropped.
 */
export function slugify(text: string, maxLength = 80): string {
	return text
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.slice(0, maxLength)
		.replace(/^-+|-+$/g, "");
}
