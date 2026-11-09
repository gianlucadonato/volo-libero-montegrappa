"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { IconType } from "react-icons";
import { BsPersonVcard } from "react-icons/bs";
import { FaBusSimple } from "react-icons/fa6";
import { GiWindsock } from "react-icons/gi";
import { GrTarget } from "react-icons/gr";
import { LuRadioTower } from "react-icons/lu";
import { MdFlight } from "react-icons/md";
import { TiWeatherPartlySunny } from "react-icons/ti";
import { PUBLIC_MEDIA_BASE_URL } from "@/config/constants";

const LINK_CLASS = "text-sm font-bold uppercase italic underline";

/** One block of the page; texts in FlyingAreaPage.<key> (title, text, link). */
type InfoBlock = {
	key: string;
	Icon: IconType;
	iconSize: string;
	href: string;
	external?: boolean;
	/** Downloads this waypoint archive instead of following `href`. */
	download?: string;
	className?: string;
};

const ESSENTIALS: InfoBlock[] = [
	{
		key: "takeoffs",
		Icon: GiWindsock,
		iconSize: "sm:text-[75px]",
		href: "/decolli",
	},
	{
		key: "landings",
		Icon: GrTarget,
		iconSize: "sm:text-[65px]",
		href: "/atterraggi",
	},
	{
		key: "airspaces",
		Icon: MdFlight,
		iconSize: "sm:text-[70px]",
		href: "#",
		download: "spazi-aerei",
	},
	{
		key: "weather",
		Icon: TiWeatherPartlySunny,
		iconSize: "sm:text-[75px]",
		href: "/meteo",
	},
];

const MORE_INFO: InfoBlock[] = [
	{
		key: "flycard",
		Icon: BsPersonVcard,
		iconSize: "sm:text-[65px]",
		href: "https://flycard.vivereilgrappa.it",
		external: true,
		className: "lg:col-start-2",
	},
	{
		key: "shuttles",
		Icon: FaBusSimple,
		iconSize: "sm:text-[65px]",
		href: "/contatti",
		className: "lg:col-start-3",
	},
	{
		key: "radio",
		Icon: LuRadioTower,
		iconSize: "sm:text-[65px]",
		href: "https://www.reteradiomontana.it",
		external: true,
		className: "lg:col-start-4",
	},
];

function downloadWaypoints(file: string) {
	window.open(`${PUBLIC_MEDIA_BASE_URL}/waypoints/${file}.zip`, "_blank");
}

function InfoBlockCard({ block }: { block: InfoBlock }) {
	const t = useTranslations("FlyingAreaPage");
	const { key, Icon, iconSize, href, external, download, className } = block;
	return (
		<div className={`col-span-1 px-6 ${className ?? ""}`}>
			<div className="flex items-center justify-start sm:flex-col sm:items-start">
				<div className="mb-4 sm:min-h-[75px]">
					<Icon className={`text-lime mr-4 text-5xl ${iconSize}`} />
				</div>
				<h2 className="font-heading text-xl uppercase sm:text-2xl">
					{t(`${key}.title`)}
				</h2>
			</div>
			<p className="pb-2 pt-4">{t(`${key}.text`)}</p>
			<Link
				href={href}
				target={external ? "_blank" : undefined}
				onClick={
					download
						? (e) => {
								e.preventDefault();
								downloadWaypoints(download);
							}
						: undefined
				}
				className={LINK_CLASS}
			>
				{t(`${key}.link`)}
			</Link>
		</div>
	);
}

function SectionTitle({
	title,
	highlight,
}: {
	title: string;
	highlight: string;
}) {
	return (
		<h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
			<span className="block">{title}</span>
			<span className="highlight block">{highlight}</span>
		</h1>
	);
}

export default function AreadiVolo() {
	const t = useTranslations("FlyingAreaPage");

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
			<section className="px-4 pb-10 pt-20">
				<div className="container mx-auto flex min-h-[310px] flex-col items-center gap-16">
					<div>
						<SectionTitle
							title={t("essentials.title")}
							highlight={t("essentials.highlight")}
						/>
						<div className="grid grid-cols-1 gap-y-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
							{ESSENTIALS.map((block) => (
								<InfoBlockCard key={block.key} block={block} />
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="px-4 py-10">
				<div className="container mx-auto flex min-h-[320px] flex-col items-center gap-16">
					<div>
						<SectionTitle
							title={t("more.title")}
							highlight={t("more.highlight")}
						/>
						<div className="grid grid-cols-1 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-5">
							{MORE_INFO.map((block) => (
								<InfoBlockCard key={block.key} block={block} />
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="px-4 py-10">
				<div className="container mx-auto flex min-h-[320px] flex-col items-center gap-16">
					<div>
						<h1 className="text-center font-heading text-2xl uppercase sm:text-3xl">
							<span>{t("fly.title")}</span>
							<span className="highlight ml-2">{t("fly.highlight")}</span>
						</h1>

						<div className="py-10">
							<p className="mx-auto max-w-3xl text-center">
								{t.rich("fly.intro", {
									br: () => <br />,
									strong: (chunks) => <strong>{chunks}</strong>,
								})}
							</p>
						</div>

						<div className="align-center flex flex-col justify-center sm:flex-row">
							<div className="mx-auto mb-6 max-w-[400px] rounded-lg border-2 p-6">
								<Image
									src="/volare-in-biposto.png"
									alt={t("fly.tandem.alt")}
									width={350}
									height={350}
								/>
								<div className="p-4">{t("fly.tandem.text")}</div>
								<div className="gap-2 p-4">
									<Link
										href="https://www.montegrappatandemteam.it"
										target="_blank"
										className={`mb-4 block ${LINK_CLASS}`}
									>
										MONTEGRAPPA TANDEM TEAM
									</Link>
									<Link
										href="https://www.airsportsmontegrappa.it"
										target="_blank"
										className={`block ${LINK_CLASS}`}
									>
										AIRSPORTS MONTEGRAPPA
									</Link>
								</div>
							</div>

							<div className="mx-auto mb-6 max-w-[400px] rounded-lg border-2 p-6 sm:ml-6">
								<Image
									src="/corsi-scuola.png"
									alt={t("fly.school.alt")}
									width={350}
									height={350}
								/>
								<div className="p-4">{t("fly.school.text")}</div>
								<div className="gap-2 p-4">
									<Link
										href="https://www.mantaonline.it"
										target="_blank"
										className={`block ${LINK_CLASS}`}
									>
										ASD MANTA
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
