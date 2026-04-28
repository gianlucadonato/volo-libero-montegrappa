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

export interface XcCelebrationStats {
	totalDistanceKm: number;
	flightTimeHrs: number;
	maxAltM: number;
}

export default function XcCelebrationCard({
	level,
	stats,
}: {
	level: string;
	stats?: XcCelebrationStats;
}) {
	const t = useTranslations("XcCategoryPage");
	const theme = LEVEL_THEME[level] ?? LEVEL_THEME.basic;

	return (
		<div
			className={`mb-8 overflow-hidden rounded-xl border ${theme.border} shadow-sm`}
		>
			{/* Medal + text */}
			<div className={`flex items-center gap-6 ${theme.bg} p-6`}>
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

			{/* Aggregated flight stats */}
			{stats && (
				<div
					className="relative bg-cover bg-center"
					style={{ backgroundImage: "url('/bg-feltre.webp')" }}
				>
					<div className="absolute inset-0 bg-[#1a2744]/80" />
					<div className="relative px-6 py-6">
						<div className="flex flex-wrap items-center justify-center gap-4">
							<StatCard
								label={t("celebration.stats.totalDistance")}
								value={stats.totalDistanceKm.toLocaleString()}
								unit="km"
							/>
							<StatCard
								label={t("celebration.stats.flightTime")}
								value={stats.flightTimeHrs.toLocaleString()}
								unit="hrs"
							/>
							<StatCard
								label={t("celebration.stats.maxAlt")}
								value={stats.maxAltM.toLocaleString()}
								unit="m"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function StatCard({
	label,
	value,
	unit,
}: {
	label: string;
	value: string;
	unit: string;
}) {
	return (
		<div className="flex min-w-[140px] flex-col items-center rounded-lg border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-sm">
			<span className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
				{label}
			</span>
			<div className="flex items-baseline gap-1.5">
				<span className="text-3xl font-bold text-white">{value}</span>
				<span className="text-sm font-medium text-slate-300">{unit}</span>
			</div>
		</div>
	);
}
