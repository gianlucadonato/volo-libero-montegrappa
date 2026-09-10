"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { PUBLIC_MEDIA_BASE_URL } from "@/config/constants";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function HeroVideo() {
	const { isSm, isMobile } = useMediaQuery();
	const t = useTranslations("Homepage");

	return (
		<section className="relative flex h-[550px] flex-col items-center justify-center bg-[url('/bg-montegrappa.webp')] bg-cover bg-left text-center">
			<div className="video-docker absolute left-0 top-0 size-full overflow-hidden">
				<video
					className="absolute hidden min-h-full min-w-full object-cover xl:block"
					controls
					preload="none"
					autoPlay={!(isMobile || isSm)}
					muted
					loop
				>
					<source
						src={`${PUBLIC_MEDIA_BASE_URL}/videos/bg-video.mp4`}
						type="video/mp4"
					/>
				</video>
			</div>
			<div className="video-content z-10 flex flex-col items-center justify-center space-y-2 px-2 text-white">
				<Image src="/logo/LOGO_CLUB.png" alt="logo" width={120} height={120} />
				<h1 className="text-balance text-4xl font-extrabold italic tracking-tight sm:text-5xl md:text-6xl lg:text-[66px]">
					<span className="text-gradient_blue-green mb-2 block text-3xl font-extrabold">
						ASD
					</span>
					<span className="text-gradient_blue-green block font-extrabold">
						VOLO LIBERO MONTEGRAPPA
					</span>
				</h1>
				<h3 className="pt-2 text-2xl font-bold text-muted md:text-3xl">
					1979-{new Date().getFullYear()}, {new Date().getFullYear() - 1979}{" "}
					{t("header_subtitle")}
				</h3>
			</div>
		</section>
	);
}
