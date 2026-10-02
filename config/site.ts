import type { Metadata } from "next";
import { env } from "@/env";
import type { SiteConfig } from "@/types";

const site_url = env.NEXT_PUBLIC_APP_URL;

export const siteConfig: SiteConfig = {
	name: "Club Volo Libero Montegrappa",
	description: "Club Volo Libero Montegrappa - Portale Soci",
	url: site_url,
	ogImage: `${site_url}/_static/open-graph.jpg`,
	links: {
		instagram: "https://www.instagram.com/vololiberomontegrappa/",
		facebook: "https://www.facebook.com/vololiberomontegrappa/",
	},
	mailSupport: "club@vololiberomontegrappa.it",
	keywords: [
		"Club Volo Libero Montegrappa",
		"Parapendio",
		"Deltaplano",
		"Paragliding",
		"Handgliding",
		"Borso del Grappa",
		"Volo Libero",
	],
};

export function constructMetadata({
	title = siteConfig.name,
	description = siteConfig.description,
	image = siteConfig.ogImage,
	icons = "/favicon.ico",
	noIndex = false,
	path,
	type = "website",
}: {
	title?: string;
	description?: string;
	image?: string;
	icons?: string;
	noIndex?: boolean;
	// The page's own path. Shared-link previews treat og:url as the page's
	// canonical address, so it must never default to the homepage.
	path?: string;
	type?: "website" | "article";
} = {}): Metadata {
	return {
		title,
		description,
		keywords: siteConfig.keywords,
		authors: [
			{
				name: "Gianluca Donato",
			},
		],
		creator: "Gianluca Donato",
		// WhatsApp, Facebook and Telegram build the link preview from these
		// tags; og:image is the picture they show.
		openGraph: {
			type,
			locale: "it_IT",
			...(path && { url: new URL(path, siteConfig.url).toString() }),
			title,
			description,
			siteName: siteConfig.name,
			images: [image],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [image],
			creator: "@gianlucadonato",
		},
		icons,
		metadataBase: new URL(siteConfig.url),
		manifest: `${siteConfig.url}/site.webmanifest`,
		...(noIndex && {
			robots: {
				index: false,
				follow: false,
			},
		}),
	};
}
