"use client";

import { BookOpenText, Search, SunSnow } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import HeroVideo from "@/components/home/HeroVideo";
import InfoCard, { type InfoCardType } from "@/components/home/InfoCard";
import Powered from "@/components/home/Powered";
import RegisterCTA from "@/components/RegisterCTA";

export default function Home() {
	const infos = getInfos();
	return (
		<div>
			<HeroVideo />
			<RegisterCTA />
			<InfoCard data={infos[0]} reverse={true} />
			<InfoCard data={infos[1]} />
			<Powered />
			<div className="hidden md:max-2xl:block 2xl:block">
				<Image
					className="h-[460px] w-full"
					src="/Vista_del_Massiccio_del_Grappa.png"
					alt="Vista_del_Massiccio_del_Grappa"
					width={1368}
					height={460}
				/>
			</div>
		</div>
	);
}

const getInfos = (): InfoCardType[] => {
	const t = useTranslations("Homepage");
	return [
		{
			title: (
				<span>
					<span className="highlight">{t("info_1.title")}</span>
					<br />
					{t("info_1.title_2")}
				</span>
			),
			description: t("info_1.description"),
			image: "/home/home2.png",
			width: 800,
			height: 800,
			custom: true,
			list: [],
		},
		{
			title: <span className="highlight uppercase">{t("info_2.title")}</span>,
			description: t("info_2.description"),
			image: "/storia/STORIA_2019.png",
			list: [
				{
					title: t("info_2.weather.title"),
					description: t("info_2.weather.description"),
					icon: SunSnow,
					link: "/meteo",
				},
				{
					title: t("info_2.fly_area.title"),
					description: t("info_2.fly_area.description"),
					icon: Search,
					link: "/area-volo",
				},
				{
					title: t("info_2.info.title"),
					description: t("info_2.info.description"),
					icon: BookOpenText,
					link: "#",
				},
			],
		},
	];
};
