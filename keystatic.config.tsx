import { collection, config, fields } from "@keystatic/core";
import Image from "next/image";

/**
 * Keystatic CMS configuration.
 *
 * Local mode in development => writes directly to the filesystem.
 * In production, switch `storage.kind` to "github" (or "cloud") so
 * non-technical editors can publish via the Keystatic UI without
 * needing access to the codebase.
 *
 * IMPORTANT: this file is imported by both the server route handler
 * AND the client `makePage`, so the flag MUST be readable in the
 * browser bundle. Next.js only inlines `NODE_ENV` and `NEXT_PUBLIC_*`
 * into client code — server-only vars (e.g. VLM_ENV) are undefined
 * in the browser and would silently fall back to "local", causing
 * 404s on `/api/keystatic/tree` in production.
 */
const isProd = process.env.NODE_ENV === "production";

const newsCollection = (locale: "it" | "en") =>
	collection({
		label: `News (${locale.toUpperCase()})`,
		slugField: "title",
		path: `content/news/${locale}/*`,
		format: { contentField: "content" },
		entryLayout: "content",
		columns: ["title", "publishedAt"],
		schema: {
			title: fields.slug({
				name: { label: "Title", validation: { length: { min: 3, max: 160 } } },
				slug: {
					label: "Slug",
					description:
						"Used in the URL: /news/<slug>. Auto-generated from the title.",
				},
			}),
			publishedAt: fields.date({
				label: "Published at",
				description: "Posts dated in the future are hidden until that date.",
				defaultValue: { kind: "today" },
				validation: { isRequired: true },
			}),
			draft: fields.checkbox({
				label: "Draft",
				description: "Drafts are never shown on the public site.",
				defaultValue: false,
			}),
			excerpt: fields.text({
				label: "Excerpt",
				description: "Short summary shown in news listings and meta tags.",
				multiline: true,
				validation: { length: { min: 0, max: 280 } },
			}),
			coverImage: fields.image({
				label: "Cover image",
				directory: `public/news/${locale}`,
				publicPath: `/news/${locale}/`,
			}),
			content: fields.markdoc({
				label: "Content",
				options: {
					image: {
						directory: `public/news/${locale}`,
						publicPath: `/news/${locale}/`,
					},
				},
			}),
		},
	});

export default config({
	storage: {
		kind: isProd ? "cloud" : "local",
	},
	cloud: {
		project: "vlmg/news",
	},
	ui: {
		brand: {
			name: "Volo Libero Montegrappa",
			mark: () => {
				return (
					<Image
						alt="Volo Libero Montegrappa"
						src={"/logo/LOGO_CLUB.png"}
						height={24}
						width={24}
					/>
				);
			},
		},
		navigation: {
			Content: ["news_it", "news_en"],
			// Settings: ["site", "seo"],
		},
	},
	collections: {
		news_it: newsCollection("it"),
		news_en: newsCollection("en"),
	},
});
