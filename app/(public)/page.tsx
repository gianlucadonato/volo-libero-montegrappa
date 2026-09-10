import { BookOpenText, Search, SunSnow } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import HeroVideo from "@/components/home/HeroVideo";
import InfoCard, { type InfoCardType } from "@/components/home/InfoCard";
import Powered from "@/components/home/Powered";
import LatestNews from "@/components/news/LatestNews";

export default async function Home() {
	const t = await getTranslations("Homepage");
	const infos: InfoCardType[] = [
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

	return (
		<div>
			<HeroVideo />
			<InfoCard data={infos[0]} reverse={true} />
			<InfoCard data={infos[1]} />
			{/* <RegisterCTA /> */}
			<LatestNews />
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
