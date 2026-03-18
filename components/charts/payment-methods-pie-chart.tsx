"use client";

import { useMemo } from "react";
import { Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
	count: {
		label: "Transazioni",
	},
	card: {
		label: "Card",
		color: "hsl(var(--chart-7))",
	},
	bank_transfer: {
		label: "Bank Transfer",
		color: "hsl(var(--chart-6))",
	},
	cash: {
		label: "Cash",
		color: "hsl(var(--chart-9))",
	},
} satisfies ChartConfig;

export function PaymentMethodsPieChart({
	payments,
}: {
	payments: Record<string, number>;
}) {
	const chartData = useMemo(() => {
		return Object.entries(payments).map(([method, count]) => ({
			method,
			count,
			fill: `var(--color-${method})`,
		}));
	}, [payments]);

	return (
		<Card className="flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>Metodo di Pagamento</CardTitle>
				{/* <CardDescription>Gennaio 2025</CardDescription> */}
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto mt-4 aspect-square max-h-87.5 px-0"
				>
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Pie
							data={chartData}
							dataKey="count"
							labelLine={false}
							label={({ payload, ...props }) => {
								return (
									<text
										cx={props.cx}
										cy={props.cy}
										x={props.x}
										y={props.y}
										textAnchor={props.textAnchor}
										dominantBaseline={props.dominantBaseline}
										fill="hsla(var(--foreground))"
									>
										{payload.count}
									</text>
								);
							}}
							nameKey="method"
						/>
						<ChartLegend
							content={<ChartLegendContent nameKey="method" />}
							className="mt-6 -translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
