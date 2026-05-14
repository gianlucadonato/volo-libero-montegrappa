import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const poweredBy = [
	{
		title: "Vivere il Grappa",
		href: "https://www.vivereilgrappa.it/it/",
		icon: "/sponsors/vivere-il-grappa-LOGO.png",
	},
	{
		title: "Manta ASD",
		href: "https://mantaonline.it/it/",
		icon: "/sponsors/MANTA-ASD-LOGO.png",
	},
	{
		title: "Montegrappa Tandem Team",
		href: "https://www.montegrappatandemteam.it/",
		icon: "/sponsors/TANDEM-TEAM-LOGO.png",
	},
	{
		title: "Airsports Montegrappa",
		href: "https://www.airsportsmontegrappa.it/",
		icon: "/sponsors/airsports-montegrappa-LOGO.png",
	},
];

export default async function Powered() {
	const t = await getTranslations("Homepage.partners");
	return (
		<section className="py-14 text-muted-foreground">
			<div className="container mx-auto max-w-6xl">
				<h2 className="text-center font-heading text-xl uppercase">
					{t("title")}
				</h2>
				<div className="mt-4 grid grid-cols-2 place-items-center gap-8 md:grid-cols-4">
					{poweredBy.map((logo) => (
						<Link
							target="_blank"
							key={logo.title}
							href={logo.href}
							aria-label={logo.title}
							className="duration-250 grayscale transition hover:text-foreground hover:grayscale-0"
						>
							<Image src={logo.icon} width={200} height={200} alt="logo" />
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
