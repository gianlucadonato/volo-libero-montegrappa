import {
	COMPASS_SECTORS,
	parseWindDirections,
	SECTOR_LABELS,
} from "@/lib/wind-directions";

const SIZE = 140;
const CENTER = SIZE / 2;
const RADIUS = 50;
const LABEL_RADIUS = RADIUS + 13;
const ACTIVE = "#16a34a";
const INACTIVE = "#e2e8f0";

// Italian compass letters: west is "O" (ovest).
const CARDINALS = [
	{ label: "N", angle: 0 },
	{ label: "E", angle: 90 },
	{ label: "S", angle: 180 },
	{ label: "O", angle: 270 },
];

/** A point on the rose, `angle` in degrees clockwise from north. */
function point(angle: number, radius: number): [number, number] {
	const rad = (angle * Math.PI) / 180;
	return [CENTER + radius * Math.sin(rad), CENTER - radius * Math.cos(rad)];
}

function slicePath(angle: number): string {
	const [x1, y1] = point(angle - 22.5, RADIUS);
	const [x2, y2] = point(angle + 22.5, RADIUS);
	return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} Z`;
}

/**
 * A pie of the eight compass sectors with the take-off's wind directions in
 * green, read from its "Direzione vento" text.
 */
export default function WindRose({
	direction,
	className,
}: {
	direction: string;
	className?: string;
}) {
	const active = new Set(parseWindDirections(direction));
	const label = `Venti favorevoli: ${
		[...active].map((sector) => SECTOR_LABELS[sector]).join(", ") ||
		"non indicati"
	}`;

	return (
		<svg
			viewBox={`0 0 ${SIZE} ${SIZE}`}
			className={className}
			role="img"
			aria-label={label}
		>
			<title>{label}</title>
			{COMPASS_SECTORS.map((sector, index) => (
				<path
					key={sector}
					d={slicePath(index * 45)}
					fill={active.has(sector) ? ACTIVE : INACTIVE}
					stroke="#fff"
					strokeWidth={2}
				/>
			))}
			<circle cx={CENTER} cy={CENTER} r={6} fill="#fff" />
			{CARDINALS.map(({ label: letter, angle }) => {
				const [x, y] = point(angle, LABEL_RADIUS);
				return (
					<text
						key={letter}
						x={x}
						y={y}
						textAnchor="middle"
						dominantBaseline="central"
						fontSize={12}
						fontWeight={700}
						fill="#475569"
					>
						{letter}
					</text>
				);
			})}
		</svg>
	);
}
