"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { elmeteoMaxStep } from "@/lib/elmeteo-run";
import { cn } from "@/lib/utils";

const hourJumps = [1, 3, 6, 12] as const;

/**
 * Mobile puts the jumps on two rows, and the forward one is mirrored so every
 * column holds a single magnitude: -12h sits above +12h, -1h above +1h. The
 * backward buttons keep the default order (0), so ordering the forward ones
 * from 5 upwards is enough to both reverse them and keep them on the second
 * row. Reset at `sm`, where everything is one flex row in DOM order.
 */
const forwardMobileOrder = ["order-8", "order-7", "order-6", "order-5"];

type TimeControlsProps = {
	step: number;
	runStart: Date;
	onStepChange: (step: number) => void;
};

const romeTime = new Intl.DateTimeFormat("it-IT", {
	timeZone: "Europe/Rome",
	hour: "2-digit",
	minute: "2-digit",
});

const romeDay = new Intl.DateTimeFormat("it-IT", {
	timeZone: "Europe/Rome",
	weekday: "long",
	day: "2-digit",
	month: "long",
});

const romeDayKey = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Europe/Rome",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

function stepDate(runStart: Date, step: number) {
	return new Date(runStart.getTime() + step * 60 * 60 * 1000);
}

/**
 * Step of the next/previous local day, keeping the same hour when possible.
 * Falls back to the first/last step of the run at its edges.
 */
function findDayStep(runStart: Date, step: number, direction: 1 | -1) {
	const currentDay = romeDayKey.format(stepDate(runStart, step));
	const target = step + direction * 24;
	if (target >= 0 && target <= elmeteoMaxStep) {
		return target;
	}
	// Same hour is outside the run: settle for the closest step that is still in
	// another day, so the button never feels dead while a day is available.
	const edge = direction === 1 ? elmeteoMaxStep : 0;
	return romeDayKey.format(stepDate(runStart, edge)) === currentDay
		? undefined
		: edge;
}

export function TimeControls({
	step,
	runStart,
	onStepChange,
}: TimeControlsProps) {
	const current = stepDate(runStart, step);
	const previousDay = findDayStep(runStart, step, -1);
	const nextDay = findDayStep(runStart, step, 1);

	return (
		<div className="rounded-xl border bg-card p-3 sm:p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center justify-between gap-2 sm:justify-start">
					<Button
						variant="outline"
						size="icon"
						aria-label="Giorno precedente"
						disabled={previousDay === undefined}
						onClick={() =>
							previousDay !== undefined && onStepChange(previousDay)
						}
					>
						<ChevronsLeft className="size-4" />
					</Button>

					<div className="flex-1 text-center sm:min-w-[13rem] sm:flex-none">
						<p className="font-semibold text-lg leading-tight tabular-nums">
							{romeTime.format(current)}
						</p>
						<p className="text-muted-foreground text-xs capitalize">
							{romeDay.format(current)}
						</p>
					</div>

					<Button
						variant="outline"
						size="icon"
						aria-label="Giorno successivo"
						disabled={nextDay === undefined}
						onClick={() => nextDay !== undefined && onStepChange(nextDay)}
					>
						<ChevronsRight className="size-4" />
					</Button>
				</div>

				<div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center">
					{[...hourJumps].reverse().map((hours) => (
						<JumpButton
							key={`back-${hours}`}
							label={`-${hours}h`}
							// The single-hour step is the one reached for most, so it reads
							// as the filled anchor at the centre of the ladder.
							variant={hours === 1 ? "secondary" : "outline"}
							disabled={step - hours < 0}
							onClick={() => onStepChange(step - hours)}
						/>
					))}

					{hourJumps.map((hours, index) => (
						<JumpButton
							key={`forward-${hours}`}
							label={`+${hours}h`}
							variant={hours === 1 ? "secondary" : "outline"}
							className={cn(
								forwardMobileOrder[index],
								hours === 1 && "sm:ml-1",
							)}
							disabled={step + hours > elmeteoMaxStep}
							onClick={() => onStepChange(step + hours)}
						/>
					))}
				</div>
			</div>

			<div className="mt-3 flex items-center gap-3">
				<input
					type="range"
					min={0}
					max={elmeteoMaxStep}
					value={step}
					aria-label="Ora della previsione"
					onChange={(event) => onStepChange(Number(event.target.value))}
					className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
				/>
				<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
					+{step}h
				</span>
			</div>
		</div>
	);
}

function JumpButton({
	label,
	variant,
	className,
	disabled,
	onClick,
}: {
	label: string;
	variant: "outline" | "secondary";
	className?: string;
	disabled: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			variant={variant}
			size="sm"
			disabled={disabled}
			onClick={onClick}
			className={cn(
				// Buttons stretch to their grid cell on mobile so the two rows line up
				// column by column, and shrink back to their label on desktop.
				"w-full px-2 font-mono text-xs tabular-nums sm:w-auto sm:order-none",
				className,
			)}
		>
			{label}
		</Button>
	);
}
