"use client";

interface XcLevelProgressProps {
	level: string;
	levelLabel: string;
	points: number;
	minPoints: number;
	maxPoints: number;
	completedTasks: number;
	totalTasks: number;
}

export default function XcLevelProgress({
	level,
	levelLabel,
	points,
	minPoints,
	maxPoints,
}: XcLevelProgressProps) {
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
	// tick mark positions on the circle (radius 52, center 60,60)
	const tickInner = 44;
	const tickOuter = 60;
	const tickX1 = 60 + tickInner * Math.cos(thresholdRad - Math.PI / 2);
	const tickY1 = 60 + tickInner * Math.sin(thresholdRad - Math.PI / 2);
	const tickX2 = 60 + tickOuter * Math.cos(thresholdRad - Math.PI / 2);
	const tickY2 = 60 + tickOuter * Math.sin(thresholdRad - Math.PI / 2);
	// label position (slightly outside the ring)
	const labelR = 66;
	const labelX = 60 + labelR * Math.cos(thresholdRad - Math.PI / 2);
	const labelY = 60 + labelR * Math.sin(thresholdRad - Math.PI / 2);

	return (
		<div className="flex flex-col items-center">
			{/* Radial progress */}
			<div className="relative size-48">
				<svg
					viewBox="0 0 120 120"
					className="size-full"
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
						className="text-gray-700"
						transform="rotate(-90 60 60)"
					/>
					{/* Progress arc */}
					<circle
						cx="60"
						cy="60"
						r="52"
						fill="none"
						stroke="url(#progress-gradient)"
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
								stroke="#d97706"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
							<text
								x={labelX}
								y={labelY}
								textAnchor="middle"
								dominantBaseline="central"
								fill="#d97706"
								fontSize="6"
								fontWeight="600"
							>
								{minPoints}
							</text>
						</>
					)}
					<defs>
						<linearGradient
							id="progress-gradient"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="100%"
						>
							<stop offset="0%" stopColor="#22d3ee" />
							<stop offset="50%" stopColor="#a3e635" />
							<stop offset="100%" stopColor="#4ade80" />
						</linearGradient>
					</defs>
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
					<span className="text-[10px] uppercase tracking-widest text-gray-300">
						{levelLabel}
					</span>
					<span className="text-xl font-extrabold uppercase text-white">
						{level}
					</span>
					<span className="text-base font-bold text-white">
						{points}
						<span className="text-gray-300">/{maxPoints}</span>{" "}
						<span className="text-sm font-semibold text-gray-200">
							XC Points
						</span>
					</span>
				</div>
			</div>
		</div>
	);
}
