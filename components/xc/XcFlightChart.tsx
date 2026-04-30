"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { IGCFix } from "@/lib/igc-parser";

interface FlightChartPoint {
	index: number;
	time: string;
	timeShort: string;
	gpsAltitude: number;
	pressureAltitude: number | null;
	altitude: number;
	vario: number;
	speed: number;
	lat: number;
	lng: number;
}

function haversineKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const R = 6371;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

function buildChartData(fixes: IGCFix[]): FlightChartPoint[] {
	const validFixes = fixes.filter((f) => f.valid);
	if (validFixes.length === 0) return [];

	const points: FlightChartPoint[] = [];

	for (let i = 0; i < validFixes.length; i++) {
		const fix = validFixes[i];
		const gpsAlt = fix.gpsAltitude ?? fix.pressureAltitude ?? 0;
		const pressureAlt = fix.pressureAltitude;

		let vario = 0;
		let speed = 0;

		if (i > 0) {
			const prev = validFixes[i - 1];
			const prevAlt = prev.gpsAltitude ?? prev.pressureAltitude ?? 0;
			const dtSeconds = (fix.timestamp - prev.timestamp) / 1000;

			if (dtSeconds > 0) {
				vario = (gpsAlt - prevAlt) / dtSeconds;
				const distKm = haversineKm(
					prev.latitude,
					prev.longitude,
					fix.latitude,
					fix.longitude,
				);
				speed = (distKm / dtSeconds) * 3600;
			}
		}

		points.push({
			index: i,
			time: fix.time,
			timeShort: fix.time.slice(0, 5),
			gpsAltitude: Math.round(gpsAlt),
			pressureAltitude: pressureAlt != null ? Math.round(pressureAlt) : null,
			altitude: Math.round(gpsAlt),
			vario: Math.round(vario * 10) / 10,
			speed: Math.round(speed),
			lat: fix.latitude,
			lng: fix.longitude,
		});
	}

	// Smooth vario with a 5-point moving average to reduce noise
	const smoothed = points.map((p, i) => {
		const windowSize = 5;
		const half = Math.floor(windowSize / 2);
		const start = Math.max(0, i - half);
		const end = Math.min(points.length - 1, i + half);
		let sum = 0;
		let count = 0;
		for (let j = start; j <= end; j++) {
			sum += points[j].vario;
			count++;
		}
		return { ...p, vario: Math.round((sum / count) * 10) / 10 };
	});

	return smoothed;
}

// Downsample for rendering performance — keep every Nth point
function downsample(
	data: FlightChartPoint[],
	maxPoints = 800,
): FlightChartPoint[] {
	if (data.length <= maxPoints) return data;
	const step = data.length / maxPoints;
	const result: FlightChartPoint[] = [];
	for (let i = 0; i < maxPoints; i++) {
		result.push(data[Math.floor(i * step)]);
	}
	// Always include the last point
	if (result[result.length - 1] !== data[data.length - 1]) {
		result.push(data[data.length - 1]);
	}
	return result;
}

const COLOR_GPS_ALT = "#f97316"; // orange
const COLOR_BARO_ALT = "#3b82f6"; // blue
const COLOR_VARIO = "#eab308"; // amber/yellow

const chartConfig = {
	gpsAltitude: {
		label: "GPS Alt",
		color: COLOR_GPS_ALT,
	},
	pressureAltitude: {
		label: "Baro Alt",
		color: COLOR_BARO_ALT,
	},
	vario: {
		label: "Vario",
		color: COLOR_VARIO,
	},
} satisfies ChartConfig;

interface XcFlightChartProps {
	fixes: IGCFix[];
	onHoverIndex?: (index: number | null) => void;
	variant?: "default" | "overlay";
}

function formatVario(v: number): string {
	const sign = v > 0 ? "+" : "";
	return `${sign}${v.toFixed(1)} m/s`;
}

function varioBgClass(v: number): string {
	if (v > 0.3) return "bg-yellow-300 text-black";
	if (v < -0.3) return "bg-sky-400 text-black";
	return "bg-muted text-foreground";
}

export default function XcFlightChart({
	fixes,
	onHoverIndex,
	variant = "default",
}: XcFlightChartProps) {
	const t = useTranslations("XcFlightChart");
	const lastEmittedIndex = useRef<number | null>(null);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const fullData = useMemo(() => buildChartData(fixes), [fixes]);
	const chartData = useMemo(() => downsample(fullData), [fullData]);

	const stats = useMemo(() => {
		if (chartData.length === 0) {
			return { maxAlt: 0, minAlt: 0, maxClimb: 0, maxSink: 0 };
		}
		let maxAlt = -Infinity;
		let minAlt = Infinity;
		let maxClimb = 0;
		let maxSink = 0;
		for (const p of chartData) {
			if (p.gpsAltitude > maxAlt) maxAlt = p.gpsAltitude;
			if (p.gpsAltitude < minAlt) minAlt = p.gpsAltitude;
			if (p.vario > maxClimb) maxClimb = p.vario;
			if (p.vario < maxSink) maxSink = p.vario;
		}
		return { maxAlt, minAlt, maxClimb, maxSink };
	}, [chartData]);

	const hasPressure = useMemo(
		() => chartData.some((p) => p.pressureAltitude != null),
		[chartData],
	);

	// X-axis ticks every 30 minutes (HH:00 and HH:30) present in the data
	const halfHourTicks = useMemo(() => {
		const seen = new Set<string>();
		const ticks: string[] = [];
		for (const p of chartData) {
			const [hh, mm] = p.timeShort.split(":");
			if (mm === "00" || mm === "30") {
				const key = `${hh}:${mm}`;
				if (!seen.has(key)) {
					seen.add(key);
					ticks.push(p.timeShort);
				}
			}
		}
		return ticks;
	}, [chartData]);

	const handleMouseMove = useCallback(
		(state: { activeTooltipIndex?: number }) => {
			if (state.activeTooltipIndex != null) {
				const point = chartData[state.activeTooltipIndex];
				if (point && point.index !== lastEmittedIndex.current) {
					lastEmittedIndex.current = point.index;
					onHoverIndex?.(point.index);
				}
				setHoveredIndex(state.activeTooltipIndex);
			}
		},
		[chartData, onHoverIndex],
	);

	const handleMouseLeave = useCallback(() => {
		lastEmittedIndex.current = null;
		onHoverIndex?.(null);
		setHoveredIndex(null);
	}, [onHoverIndex]);

	if (chartData.length === 0) return null;

	const isOverlay = variant === "overlay";

	const lastIdx = chartData.length - 1;
	const activeIdx = hoveredIndex ?? lastIdx;
	const active = chartData[activeIdx] ?? chartData[lastIdx];

	return (
		<Card
			className={
				isOverlay
					? "rounded-none border-0 border-t bg-background/85 backdrop-blur-md shadow-none gap-0 py-0"
					: undefined
			}
		>
			<CardContent className={isOverlay ? "p-0" : undefined}>
				<ChartContainer
					config={chartConfig}
					className={`w-full ${isOverlay ? "h-28" : "h-52"}`}
				>
					<ComposedChart
						data={chartData}
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseLeave}
						margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
					>
						<defs>
							<linearGradient id="altFill" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor="hsl(var(--muted-foreground))"
									stopOpacity={0.45}
								/>
								<stop
									offset="100%"
									stopColor="hsl(var(--muted-foreground))"
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid
							strokeDasharray="0"
							stroke="hsl(var(--foreground))"
							strokeOpacity={0.18}
						/>
						<XAxis
							dataKey="timeShort"
							tickLine={false}
							axisLine={false}
							ticks={halfHourTicks}
							interval={0}
							mirror
							height={1}
							tick={(props: {
								x: number;
								y: number;
								payload: { value: string };
							}) => (
								<text
									x={props.x}
									y={props.y - 4}
									textAnchor="middle"
									fontSize={10}
									fontWeight={600}
									fill="hsl(217 91% 60%)"
								>
									{props.payload.value}
								</text>
							)}
						/>
						<YAxis
							yAxisId="alt"
							orientation="left"
							tickLine={false}
							axisLine={false}
							mirror
							width={1}
							tick={(props: {
								x: number;
								y: number;
								payload: { value: number };
							}) => (
								<text
									x={props.x + 2}
									y={props.y}
									textAnchor="start"
									dominantBaseline="middle"
									fontSize={10}
									fontWeight={500}
									fill="hsl(var(--foreground))"
								>
									{`${props.payload.value} m`}
								</text>
							)}
						/>
						<YAxis
							yAxisId="vario"
							orientation="right"
							tickLine={false}
							axisLine={false}
							tick={false}
							width={1}
							domain={[
								(dataMin: number) => Math.floor(Math.min(dataMin, -3)),
								(dataMax: number) => Math.ceil(Math.max(dataMax, 3)),
							]}
						/>

						<Tooltip
							cursor={{
								stroke: "hsl(var(--foreground))",
								strokeOpacity: 0.9,
								strokeWidth: 1,
								strokeDasharray: "4 3",
							}}
							content={() => null}
							isAnimationActive={false}
						/>

						<ReferenceLine
							yAxisId="vario"
							y={0}
							stroke="hsl(var(--muted-foreground))"
							strokeOpacity={0.25}
							strokeDasharray="2 2"
						/>

						{/* Filled altitude silhouette */}
						<Area
							yAxisId="alt"
							type="monotone"
							dataKey="gpsAltitude"
							stroke="none"
							fill="url(#altFill)"
							isAnimationActive={false}
							dot={false}
							activeDot={false}
						/>

						{/* Vario line */}
						<Line
							yAxisId="vario"
							type="monotone"
							dataKey="vario"
							stroke={COLOR_VARIO}
							strokeWidth={1}
							strokeOpacity={0.7}
							isAnimationActive={false}
							dot={false}
							activeDot={false}
						/>

						{/* Pressure altitude line (orange) */}
						{hasPressure && (
							<Line
								yAxisId="alt"
								type="monotone"
								dataKey="pressureAltitude"
								stroke={COLOR_BARO_ALT}
								strokeWidth={1.25}
								isAnimationActive={false}
								connectNulls
								dot={false}
								activeDot={false}
							/>
						)}

						{/* GPS altitude line (blue/primary) */}
						<Line
							yAxisId="alt"
							type="monotone"
							dataKey="gpsAltitude"
							stroke={COLOR_GPS_ALT}
							strokeWidth={1.5}
							isAnimationActive={false}
							dot={false}
							activeDot={{ r: 3, fill: COLOR_GPS_ALT }}
						/>
					</ComposedChart>
				</ChartContainer>

				{/* Stats bar */}
				<div
					className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-2 py-1 text-xs tabular-nums ${
						isOverlay ? "" : "mt-2 rounded-md bg-muted/30"
					}`}
				>
					<span
						className="font-semibold"
						style={{ color: COLOR_GPS_ALT }}
						title={t("altitude")}
					>
						{active.gpsAltitude} m
					</span>
					{hasPressure && active.pressureAltitude != null && (
						<span style={{ color: COLOR_BARO_ALT }} title="Baro">
							{active.pressureAltitude}m
						</span>
					)}
					<span
						className={`rounded px-1.5 py-0.5 font-semibold ${varioBgClass(active.vario)}`}
						title={t("vario")}
					>
						{formatVario(active.vario)}
					</span>
					<span className="font-medium" title={t("speed")}>
						{active.speed} km/h
					</span>
					<span className="ml-auto font-mono font-semibold">{active.time}</span>
				</div>

				{/* Legend (hidden in overlay to save space) */}
				{!isOverlay && (
					<div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
						<span className="flex items-center gap-1.5">
							<span
								className="inline-block h-0.5 w-4"
								style={{ background: COLOR_GPS_ALT }}
							/>
							{t("altitude")} GPS
						</span>
						{hasPressure && (
							<span className="flex items-center gap-1.5">
								<span
									className="inline-block h-0.5 w-4"
									style={{ background: COLOR_BARO_ALT }}
								/>
								{t("altitude")}
							</span>
						)}
						<span className="flex items-center gap-1.5">
							<span
								className="inline-block h-0.5 w-4"
								style={{ background: COLOR_VARIO }}
							/>
							{t("vario")} (m/s)
						</span>
						<span>
							max climb:{" "}
							<span className="font-medium text-foreground">
								{formatVario(stats.maxClimb)}
							</span>
						</span>
						<span>
							max sink:{" "}
							<span className="font-medium text-foreground">
								{formatVario(stats.maxSink)}
							</span>
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
