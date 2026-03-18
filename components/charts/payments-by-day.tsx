"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
	desktop: {
		label: "Pagamenti",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

type PaymentByDay = {
	day: string;
	count: number;
};

export function PaymentsByDay({ payments }: { payments: PaymentByDay[] }) {
	const total = useMemo(
		() => payments.reduce((acc, curr) => acc + curr.count, 0),
		[payments],
	);
	return (
		<Card>
			<CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
				<div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
					<CardTitle>Pagamenti</CardTitle>
					<CardDescription>
						Mostra il numero di pagamenti divisi per giorno
					</CardDescription>
				</div>
				<div className="flex">
					<button
						type="button"
						className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
					>
						<span className="text-xs text-muted-foreground">Totale</span>
						<span className="text-lg font-bold leading-none sm:text-3xl">
							{total.toLocaleString()}
						</span>
					</button>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart
						accessibilityLayer
						data={payments}
						margin={{
							top: 20,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="day"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Bar dataKey="count" fill="var(--color-desktop)" radius={8}>
							<LabelList
								position="top"
								offset={12}
								className="fill-foreground"
								fontSize={12}
							/>
						</Bar>
					</BarChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col items-start gap-2 text-sm">
				<div className="w-full text-center leading-none text-muted-foreground">
					Numero di pagamenti divisi per giorno
				</div>
			</CardFooter>
		</Card>
	);
}
