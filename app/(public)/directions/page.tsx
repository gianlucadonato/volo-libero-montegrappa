import { Car, Plane, Train } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@/components/ui/table";
import { PUBLIC_MEDIA_BASE_URL } from "@/config/constants";

// Language-neutral data; the texts are in messages/*.json under DirectionsPage.
const HEADQUARTERS = {
	image: `${PUBLIC_MEDIA_BASE_URL}/locations/sede.jpg`,
	mapsUrl: "https://maps.app.goo.gl/mhgq6irVcyurLzqA8",
	address: "Via Caose 22, 31030 Borso del Grappa (TV)",
	gps: "45.8065529, 11.7846036",
};

const CAR_ROUTES = ["vicenza", "trento", "padova", "treviso"] as const;

/** A `<link>` tag in a message, opening `href` in a new tab. */
function externalLink(href: string) {
	return (chunks: ReactNode) => (
		<Link href={href} target="_blank">
			{chunks}
		</Link>
	);
}

const STRONG = { strong: (chunks: ReactNode) => <strong>{chunks}</strong> };

export default function DirectionsPage() {
	const t = useTranslations("DirectionsPage");

	return (
		<div className="mb-12">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/bg-montegrappa.webp')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							{t("banner.title")}
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							{t("banner.subtitle")}
						</h3>
					</div>
				</div>
			</div>

			<section className="px-4 py-20">
				<div className="container mx-auto flex max-w-6xl flex-col items-center gap-16">
					<div className="grid gap-y-10 sm:grid-cols-12 sm:gap-y-12 md:gap-y-16 lg:gap-y-20">
						<HeadquartersCard />
					</div>
				</div>

				<div className="container mx-auto mt-20 flex max-w-6xl flex-col items-center">
					<div className="flex flex-col items-center justify-center gap-16 sm:flex-row">
						<Link href="/contatti">
							<h1 className="highlight font-heading text-2xl uppercase">
								{t("links.contacts")}
							</h1>
						</Link>
						<Link href="/area-volo">
							<h1 className="highlight font-heading text-2xl uppercase">
								{t("links.flyingArea")}
							</h1>
						</Link>
					</div>
				</div>

				<div className="container mx-auto mt-20 max-w-6xl gap-16 pt-10">
					<h2 className="mb-4 text-2xl font-bold">{t("howTo.title")}</h2>
					<h3 className="my-2 flex items-center gap-2 text-lg font-bold">
						<Train className="size-5 shrink-0" />
						{t("howTo.train.title")}
					</h3>
					<p>
						{t.rich("howTo.train.text", {
							link: externalLink("https://www.trenitalia.com/it/it.html"),
						})}
					</p>
					<h3 className="my-2 flex items-center gap-2 text-lg font-bold">
						<Plane className="size-5 shrink-0" />
						{t("howTo.plane.title")}
					</h3>
					<p>{t("howTo.plane.intro")}</p>
					<ul>
						<li>
							{t.rich("howTo.plane.venice", {
								link: externalLink("https://www.veniceairport.it/"),
							})}
						</li>
						<li>
							{t.rich("howTo.plane.treviso", {
								link: externalLink("https://www.trevisoairport.it/"),
							})}
						</li>
					</ul>
					<h3 className="my-2 flex items-center gap-2 text-lg font-bold">
						<Car className="size-5 shrink-0" />
						{t("howTo.car.title")}
					</h3>
					{CAR_ROUTES.map((from) => (
						<p key={from} className="my-2">
							{t.rich(`howTo.car.${from}`, STRONG)}
						</p>
					))}
				</div>
			</section>
		</div>
	);
}

function HeadquartersCard() {
	const t = useTranslations("DirectionsPage");
	const title = t("headquarters.title");

	return (
		<div className="group order-last grid gap-y-6 sm:order-first sm:col-span-12 sm:grid-cols-10 sm:gap-x-5 sm:gap-y-0 md:items-center md:gap-x-8 lg:col-span-10 lg:col-start-2 lg:gap-x-12">
			<div className="sm:col-span-5">
				<div className="mb-4 md:mb-6">
					<div className="flex text-xs uppercase tracking-wider text-muted-foreground">
						<span className="mr-3 md:mr-5 lg:mr-6">
							{t("headquarters.kicker")}
						</span>
					</div>
				</div>
				<h3 className="font-heading text-xl uppercase md:text-2xl lg:text-3xl">
					{title}
				</h3>
				<div className="mt-4 flex items-center space-x-2 md:mt-5">
					<span className="md:text-base">{t("headquarters.description")}</span>
				</div>
				<div className="mt-4 flex items-center space-x-2 md:mt-5">
					<Table>
						<TableBody>
							<TableRow className="w-full">
								<TableHead>{t("table.where")}</TableHead>
								<TableCell>{t("headquarters.place")}</TableCell>
							</TableRow>
							<TableRow className="w-full">
								<TableHead>{t("table.address")}</TableHead>
								<TableCell>
									<Link href={HEADQUARTERS.mapsUrl} target="_blank">
										{HEADQUARTERS.address}
									</Link>
								</TableCell>
							</TableRow>
							<TableRow className="w-full">
								<TableHead>{t("table.gps")}</TableHead>
								<TableCell>{HEADQUARTERS.gps}</TableCell>
							</TableRow>
							<TableRow className="w-full">
								<TableHead>{t("table.parking")}</TableHead>
								<TableCell>{t("table.yes")}</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</div>
			<div className="order-first sm:order-last sm:col-span-5">
				<div className="text-clip rounded-lg border border-border">
					<Image
						src={HEADQUARTERS.image}
						alt={title}
						className="size-full object-cover transition-transform group-hover:scale-105"
						width={300}
						height={300}
					/>
				</div>
			</div>
		</div>
	);
}
