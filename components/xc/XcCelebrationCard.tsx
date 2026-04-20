import Image from "next/image";
import { useTranslations } from "next-intl";

const MEDAL_IMAGE: Record<string, string> = {
	basic: "/xc/bronze-medal.PNG",
	intermediate: "/xc/silver-medal.PNG",
	advanced: "/xc/gold-medal.PNG",
};

const LEVEL_THEME: Record<
	string,
	{
		border: string;
		bg: string;
		title: string;
		subtitle: string;
		description: string;
	}
> = {
	basic: {
		border: "border-[#B87333]/40",
		bg: "bg-[#e6e0da]",
		title: "text-[#B87333]",
		subtitle: "text-[#6B4226]",
		description: "text-[#7D5A3C]",
	},
	intermediate: {
		border: "border-[#9CA3AF]/40",
		bg: "bg-[#dcdcdc]",
		title: "text-[#71717A]",
		subtitle: "text-[#3F3F46]",
		description: "text-[#52525B]",
	},
	advanced: {
		border: "border-[#D4AF37]/40",
		bg: "bg-[#e5e2d5]",
		title: "text-[#B8960C]",
		subtitle: "text-[#6B5B1F]",
		description: "text-[#5C5533]",
	},
};

export default function XcCelebrationCard({ level }: { level: string }) {
	const t = useTranslations("XcCategoryPage");
	const theme = LEVEL_THEME[level] ?? LEVEL_THEME.basic;

	return (
		<div
			className={`mb-8 flex items-center gap-6 rounded-xl border ${theme.border} ${theme.bg} p-6 shadow-sm`}
		>
			<div className="relative size-24 shrink-0 sm:size-28">
				<Image
					src={MEDAL_IMAGE[level] ?? MEDAL_IMAGE.basic}
					alt={t(`celebration.${level}.title`)}
					fill
					className="object-contain"
				/>
			</div>
			<div>
				<h3
					className={`mb-1 text-xl font-bold tracking-wide sm:text-2xl ${theme.title}`}
				>
					{t(`celebration.${level}.title`)}
				</h3>
				<p className={`mb-1 text-base font-semibold ${theme.subtitle}`}>
					{t(`celebration.${level}.subtitle`)}
				</p>
				<p className={`text-sm ${theme.description}`}>
					{t(`celebration.${level}.description`)}
				</p>
			</div>
		</div>
	);
}
