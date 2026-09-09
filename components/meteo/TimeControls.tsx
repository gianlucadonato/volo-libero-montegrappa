"use client";

import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { elmeteoMaxStep } from "@/lib/elmeteo-run";
import { cn } from "@/lib/utils";

const hourJumps = [1, 3, 6, 12] as const;

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
				<div className="flex items-center gap-2">
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

					<div className="min-w-[13rem] text-center">
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

				<div className="flex flex-wrap items-center justify-center gap-1.5">
					{[...hourJumps].reverse().map((hours) => (
						<JumpButton
							key={`back-${hours}`}
							label={`-${hours}h`}
							disabled={step - hours < 0}
							onClick={() => onStepChange(step - hours)}
						/>
					))}

					<div className="mx-1 flex items-center gap-1">
						<Button
							variant="secondary"
							size="icon"
							aria-label="Un'ora indietro"
							disabled={step <= 0}
							onClick={() => onStepChange(step - 1)}
						>
							<ChevronLeft className="size-4" />
						</Button>
						<Button
							variant="secondary"
							size="icon"
							aria-label="Un'ora avanti"
							disabled={step >= elmeteoMaxStep}
							onClick={() => onStepChange(step + 1)}
						>
							<ChevronRight className="size-4" />
						</Button>
					</div>

					{hourJumps.map((hours) => (
						<JumpButton
							key={`forward-${hours}`}
							label={`+${hours}h`}
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
	disabled,
	onClick,
}: {
	label: string;
	disabled: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			variant="outline"
			size="sm"
			disabled={disabled}
			onClick={onClick}
			className={cn("px-2 font-mono text-xs tabular-nums")}
		>
			{label}
		</Button>
	);
}
