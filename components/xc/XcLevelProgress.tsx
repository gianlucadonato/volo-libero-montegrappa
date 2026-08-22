"use client";

import { cn } from "@/lib/utils";

interface XcLevelProgressProps {
	level: string;
	levelLabel: string;
	points: number;
	minPoints: number;
	maxPoints: number;
	completedTasks: number;
	totalTasks: number;
	/** "dark" for panels over a dark photo/fill, "light" for pale backgrounds. */
	variant?: "dark" | "light";
}

export default function XcLevelProgress({
	level,
	levelLabel,
	points,
	minPoints,
	maxPoints,
	variant = "dark",
}: XcLevelProgressProps) {
	const isLight = variant === "light";
	const gradientId = isLight ? "xc-progress-light" : "xc-progress-dark";
	const trackClass = isLight ? "text-slate-400" : "text-gray-700";
	const markerColor = isLight ? "#b45309" : "#fbbf24";
	const mutedClass = isLight ? "text-slate-500" : "text-gray-300";
	const valueClass = isLight ? "text-slate-900" : "text-white";
	const effectiveMax = maxPoints > 0 ? maxPoints : minPoints;
	const progressPct = Math.min((points / effectiveMax) * 100, 100);
	const circumference = 2 * Math.PI * 52;

	// minPoints threshold marker angle (starting from top, clockwise)
	const thresholdPct =
		effectiveMax > 0 && minPoints > 0 && minPoints < effectiveMax
			? (minPoints / effectiveMax) * 100
			: null;
	// SVG circle starts at 3 o'clock; we rotate -90° so 0% = top
	const thresholdAngle = thresholdPct !== null ? (thresholdPct / 100) * 360 : 0;
	const thresholdRad = (thresholdAngle * Math.PI) / 180;
	// The tick must straddle the ring itself (r 52, stroke 7 -> 48.5..55.5),
	// not poke into the centre where the score is printed.
	const tickInner = 46.5;
	const tickOuter = 57.5;
	const tickX1 = 60 + tickInner * Math.cos(thresholdRad - Math.PI / 2);
	const tickY1 = 60 + tickInner * Math.sin(thresholdRad - Math.PI / 2);
	const tickX2 = 60 + tickOuter * Math.cos(thresholdRad - Math.PI / 2);
	const tickY2 = 60 + tickOuter * Math.sin(thresholdRad - Math.PI / 2);
	// Label sits just outside the ring; the svg is overflow-visible because
	// this radius falls outside the 120x120 viewBox.
	const labelR = 65;
	const labelX = 60 + labelR * Math.cos(thresholdRad - Math.PI / 2);
	const labelY = 60 + labelR * Math.sin(thresholdRad - Math.PI / 2);

	return (
		<div className="flex flex-col items-center">
			{/* Radial progress */}
			<div className="relative size-48">
				<svg
					viewBox="0 0 120 120"
					className="size-full overflow-visible"
					role="img"
					aria-label="Progress"
				>
					{/* Background track */}
					<circle
						cx="60"
						cy="60"
						r="52"
						fill="none"
						stroke="currentColor"
						strokeWidth="7"
						className={trackClass}
						transform="rotate(-90 60 60)"
					/>
					{/* Progress arc */}
					<circle
						cx="60"
						cy="60"
						r="52"
						fill="none"
						stroke={`url(#${gradientId})`}
						strokeWidth="7"
						strokeLinecap="round"
						strokeDasharray={`${Math.min((progressPct / 100) * circumference, circumference)} ${circumference}`}
						transform="rotate(-90 60 60)"
					/>
					{/* Threshold tick mark */}
					{thresholdPct !== null && (
						<>
							<line
								x1={tickX1}
								y1={tickY1}
								x2={tickX2}
								y2={tickY2}
								stroke={markerColor}
								strokeWidth="2"
								strokeLinecap="round"
							/>
							<text
								x={labelX}
								y={labelY}
								textAnchor="middle"
								dominantBaseline="central"
								fill={markerColor}
								fontSize="7"
								fontWeight="700"
							>
								{minPoints}
							</text>
						</>
					)}
					<defs>
						<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
							{isLight ? (
								<>
									<stop offset="0%" stopColor="#0891b2" />
									<stop offset="50%" stopColor="#65a30d" />
									<stop offset="100%" stopColor="#16a34a" />
								</>
							) : (
								<>
									<stop offset="0%" stopColor="#22d3ee" />
									<stop offset="50%" stopColor="#a3e635" />
									<stop offset="100%" stopColor="#4ade80" />
								</>
							)}
						</linearGradient>
					</defs>
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
					<span
						className={cn("text-[10px] uppercase tracking-widest", mutedClass)}
					>
						{levelLabel}
					</span>
					<span className={cn("text-xl font-extrabold uppercase", valueClass)}>
						{level}
					</span>
					<span className={cn("text-base font-bold", valueClass)}>
						{points}
						<span className={mutedClass}>/{maxPoints}</span>
					</span>
					<span
						className={cn(
							"text-[10px] font-semibold uppercase tracking-widest",
							mutedClass,
						)}
					>
						XC Points
					</span>
				</div>
			</div>
		</div>
	);
}
