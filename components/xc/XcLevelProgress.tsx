"use client";

interface XcLevelProgressProps {
	level: string;
	levelLabel: string;
	points: number;
	minPoints: number;
	completedTasks: number;
	totalTasks: number;
}

export default function XcLevelProgress({
	level,
	levelLabel,
	points,
	minPoints,
}: XcLevelProgressProps) {
	const progressPct = Math.min((points / minPoints) * 100, 100);
	const circumference = 2 * Math.PI * 52;

	return (
		<div className="flex flex-col items-center">
			{/* Radial progress */}
			<div className="relative size-48">
				<svg
					viewBox="0 0 120 120"
					className="size-full -rotate-90"
					role="img"
					aria-label="Progress"
				>
					<circle
						cx="60"
						cy="60"
						r="52"
						fill="none"
						stroke="currentColor"
						strokeWidth="7"
						className="text-gray-700"
					/>
					<circle
						cx="60"
						cy="60"
						r="52"
						fill="none"
						stroke="url(#progress-gradient)"
						strokeWidth="7"
						strokeLinecap="round"
						strokeDasharray={`${Math.min((progressPct / 100) * circumference, circumference)} ${circumference}`}
					/>
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
						<span className="text-gray-300">/{minPoints}</span>{" "}
						<span className="text-sm font-semibold text-gray-200">
							XC Points
						</span>
					</span>
				</div>
			</div>
		</div>
	);
}
