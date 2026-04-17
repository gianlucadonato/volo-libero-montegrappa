"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { IGCFix } from "@/lib/igc-parser";

interface FlightChartPoint {
	index: number;
	time: string;
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
		const alt = fix.gpsAltitude ?? fix.pressureAltitude ?? 0;

		let vario = 0;
		let speed = 0;

		if (i > 0) {
			const prev = validFixes[i - 1];
			const prevAlt = prev.gpsAltitude ?? prev.pressureAltitude ?? 0;
			const dtSeconds = (fix.timestamp - prev.timestamp) / 1000;

			if (dtSeconds > 0) {
				vario = (alt - prevAlt) / dtSeconds;
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
			altitude: Math.round(alt),
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

const chartConfig = {
	altitude: {
		label: "Altitude",
		color: "hsl(var(--chart-1))",
	},
	vario: {
		label: "Vario",
		color: "hsl(var(--chart-2))",
	},
	speed: {
		label: "Speed",
		color: "hsl(var(--chart-3))",
	},
} satisfies ChartConfig;

interface XcFlightChartProps {
	fixes: IGCFix[];
	onHoverIndex?: (index: number | null) => void;
}

export default function XcFlightChart({
	fixes,
	onHoverIndex,
}: XcFlightChartProps) {
	const t = useTranslations("XcFlightChart");
	const lastEmittedIndex = useRef<number | null>(null);

	const fullData = useMemo(() => buildChartData(fixes), [fixes]);
	const chartData = useMemo(() => downsample(fullData), [fullData]);

	const handleMouseMove = useCallback(
		(state: { activeTooltipIndex?: number }) => {
			if (state.activeTooltipIndex != null) {
				const point = chartData[state.activeTooltipIndex];
				if (point && point.index !== lastEmittedIndex.current) {
					lastEmittedIndex.current = point.index;
					onHoverIndex?.(point.index);
				}
			}
		},
		[chartData, onHoverIndex],
	);

	const handleMouseLeave = useCallback(() => {
		lastEmittedIndex.current = null;
		onHoverIndex?.(null);
	}, [onHoverIndex]);

	if (chartData.length === 0) return null;

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-lg">{t("title")}</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-52 w-full">
					<ComposedChart
						data={chartData}
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseLeave}
						margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
					>
						<defs>
							<linearGradient id="altFill" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor="hsl(var(--chart-1))"
									stopOpacity={0.4}
								/>
								<stop
									offset="100%"
									stopColor="hsl(var(--chart-1))"
									stopOpacity={0.05}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid
							vertical={false}
							strokeDasharray="3 3"
							strokeOpacity={0.3}
						/>
						<XAxis
							dataKey="time"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tick={{ fontSize: 10 }}
							interval="preserveStartEnd"
							minTickGap={60}
						/>
						<YAxis
							yAxisId="alt"
							orientation="left"
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 10 }}
							width={45}
							label={{
								value: "m",
								position: "insideTopLeft",
								offset: -5,
								style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
							}}
						/>
						<YAxis
							yAxisId="vario"
							orientation="right"
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 10 }}
							width={40}
							label={{
								value: "m/s",
								position: "insideTopRight",
								offset: -5,
								style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
							}}
						/>

						<Tooltip
							content={({ active, payload }) => {
								if (!active || !payload?.length) return null;
								const d = payload[0].payload as FlightChartPoint;
								return (
									<div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
										<p className="mb-1 font-medium">{d.time}</p>
										<div className="space-y-0.5 text-muted-foreground">
											<p>
												{t("altitude")}:{" "}
												<span className="font-medium text-foreground">
													{d.altitude} m
												</span>
											</p>
											<p>
												{t("vario")}:{" "}
												<span
													className={`font-medium ${d.vario >= 0 ? "text-green-500" : "text-red-500"}`}
												>
													{d.vario > 0 ? "+" : ""}
													{d.vario} m/s
												</span>
											</p>
											<p>
												{t("speed")}:{" "}
												<span className="font-medium text-foreground">
													{d.speed} km/h
												</span>
											</p>
										</div>
									</div>
								);
							}}
						/>

						<ReferenceLine
							yAxisId="vario"
							y={0}
							stroke="hsl(var(--muted-foreground))"
							strokeOpacity={0.3}
							strokeDasharray="2 2"
						/>

						<Area
							yAxisId="alt"
							type="monotone"
							dataKey="altitude"
							stroke="hsl(var(--chart-1))"
							strokeWidth={1.5}
							fill="url(#altFill)"
							dot={false}
							activeDot={false}
						/>
						<Line
							yAxisId="vario"
							type="monotone"
							dataKey="vario"
							stroke="hsl(var(--chart-2))"
							strokeWidth={1}
							dot={false}
							activeDot={false}
						/>
					</ComposedChart>
				</ChartContainer>

				<div className="mt-2 flex justify-center gap-6 text-xs text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<span className="inline-block size-2.5 rounded-full bg-[hsl(var(--chart-1))]" />
						{t("altitude")} (m)
					</span>
					<span className="flex items-center gap-1.5">
						<span className="inline-block size-2.5 rounded-full bg-[hsl(var(--chart-2))]" />
						{t("vario")} (m/s)
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
