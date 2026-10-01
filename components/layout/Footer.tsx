"use client";

import { Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import CustomIcons from "@/components/custom-icons";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

// Titles and link names are keys under Footer in messages/*.json; the social
// network names are brands and stay as they are.
type Section = {
	title: string;
	links: {
		name: string;
		translate?: boolean;
		icon?: React.ElementType;
		href: string;
		target?: string;
	}[];
};

const sections: Section[] = [
	{
		title: "info",
		links: [
			{ name: "flying_area", translate: true, href: "/area-volo" },
			{ name: "takeoffs", translate: true, href: "/decolli" },
			{ name: "landings", translate: true, href: "/atterraggi" },
			{ name: "directions", translate: true, href: "/directions" },
		],
	},
	{
		title: "site",
		links: [
			{ name: "club", translate: true, href: "/club" },
			{ name: "weather", translate: true, href: "/meteo" },
			{ name: "events", translate: true, href: "/events" },
		],
	},
	{
		title: "access",
		links: [
			{ name: "membership", translate: true, href: "/membership" },
			{ name: "reserved_area", translate: true, href: "/login" },
		],
	},
	{
		title: "social",
		links: [
			{
				name: "Facebook",
				icon: CustomIcons.facebook,
				href: "https://www.facebook.com/vololiberomontegrappa/",
				target: "_blank",
			},
			{
				name: "Instagram",
				icon: CustomIcons.instagram,
				href: "https://www.instagram.com/vololiberomontegrappa/",
				target: "_blank",
			},
			{ name: "contacts", translate: true, icon: Mail, href: "/contatti" },
		],
	},
];

export default function Footer() {
	const t = useTranslations("Footer");

	return (
		<section className="border">
			<footer>
				<div className="grid grid-cols-2 gap-8 p-10 lg:grid-cols-6">
					<div className="col-span-2 mb-8 lg:mb-0">
						<div className="flex items-center justify-center gap-2">
							<Image
								src="/logo/LOGO_COLOR.png"
								alt="Club Volo Libero Montegrappa"
								width={284}
								height={39}
							/>
						</div>
						{/* <p className="mt-4 text-center font-bold">Club Volo Libero Montegrappa</p> */}
					</div>
					{sections.map((section, sectionIdx) => (
						<div key={sectionIdx}>
							<h3 className="mb-4 font-bold">{t(section.title)}</h3>
							<ul className="space-y-4 text-muted-foreground">
								{section.links.map((link, linkIdx) => {
									return (
										<li
											key={linkIdx}
											className="font-medium hover:text-primary"
										>
											<Link
												href={link.href}
												target={link.target}
												className="flex items-center"
											>
												{link.icon && <link.icon className="mr-2 size-5" />}
												{link.translate ? t(link.name) : link.name}
											</Link>
										</li>
									);
								})}
							</ul>
						</div>
					))}
				</div>
				<div className="mt-10 flex flex-col justify-between gap-4 border-t p-10 pt-8 text-sm font-medium text-muted-foreground md:flex-row md:items-center">
					<p>{t("copyright", { year: new Date().getFullYear() })}</p>
					<ul className="flex gap-4">
						<li className="underline hover:text-primary">
							<Dialog>
								<DialogTrigger asChild>
									<div className="cursor-pointer">{t("credits")}</div>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[425px]">
									<DialogHeader>
										<DialogTitle>{t("credits_title")}</DialogTitle>
										<DialogDescription>
											<div>
												<div className="mb-2">
													{t("made_by")}{" "}
													<a
														href="https://www.facebook.com/giandnt"
														target="_blank"
														rel="noreferrer"
													>
														Gianluca Donato
													</a>
												</div>
												<Link
													href="https://www.facebook.com/giandnt"
													target="_blank"
												>
													<div className="mb-2 flex items-center">
														<CustomIcons.facebook className="mr-2 size-4" />{" "}
														@giandnt
													</div>
												</Link>
												<Link
													href="https://www.instagram.com/gianlucadonato"
													target="_blank"
												>
													<div className="mb-2 flex items-center">
														<CustomIcons.instagram className="mr-2 size-4" />{" "}
														@gianlucadonato
													</div>
												</Link>
												<Link href="mailto:gian.dnt@gmail.com">
													<div className="mb-2 flex items-center">
														<Mail className="mr-2 size-4" /> gian.dnt@gmail.com
													</div>
												</Link>
											</div>
										</DialogDescription>
									</DialogHeader>
								</DialogContent>
							</Dialog>
						</li>
						<li className="underline hover:text-primary">
							<Link href="/terms-conditions">{t("terms")}</Link>
						</li>
						<li className="underline hover:text-primary">
							<Link href="/privacy-policy">{t("privacy")}</Link>
						</li>
					</ul>
				</div>
			</footer>
		</section>
	);
}
