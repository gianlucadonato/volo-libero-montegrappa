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
}: {
	title?: string;
	description?: string;
	image?: string;
	icons?: string;
	noIndex?: boolean;
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
		openGraph: {
			type: "website",
			locale: "en_US",
			url: siteConfig.url,
			title,
			description,
			siteName: title,
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
