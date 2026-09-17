"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { type ElmeteoSlot, findSlotIndex } from "@/lib/elmeteo-run";
import { cn } from "@/lib/utils";

const hourJumps = [1, 3, 6, 12] as const;
const millisecondsPerHour = 60 * 60 * 1000;

/**
 * Mobile puts the jumps on two rows, one magnitude per column, with the finest
 * step on the left: -1h above +1h, -12h above +12h. That means mirroring the
 * backward row, which sits in the DOM as -12h…-1h. Both rows are ordered
 * explicitly, since leaving one at the default 0 would float it above the other
 * (positive `order` always comes after 0). Reset at `sm`, where the jumps sit on
 * a single flex row running from -12h to +12h in DOM order.
 */
const backwardMobileOrder = ["order-4", "order-3", "order-2", "order-1"];
const forwardMobileOrder = ["order-5", "order-6", "order-7", "order-8"];

type TimeControlsProps = {
	slots: readonly ElmeteoSlot[];
	index: number;
	onIndexChange: (index: number) => void;
};

/**
 * The clock and the date as the user reads them, in the flying zone's timezone.
 *
 * Built per locale rather than pinned to it-IT: the maps are captioned in
 * 24-hour time, so the clock stays h23 in both languages, but the weekday and
 * the month have to be words the reader knows.
 */
function romeFormatters(locale: string) {
	return {
		time: new Intl.DateTimeFormat(locale, {
			timeZone: "Europe/Rome",
			hourCycle: "h23",
			hour: "2-digit",
			minute: "2-digit",
		}),
		day: new Intl.DateTimeFormat(locale, {
			timeZone: "Europe/Rome",
			weekday: "long",
			day: "2-digit",
			month: "long",
		}),
	};
}

/** Machine key for "same local day", so this one stays pinned to ISO. */
const romeDayKey = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Europe/Rome",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

/**
 * Index of the slot `hours` away from the current one, or undefined when the
 * timeline does not reach that far.
 *
 * Navigation is by instant rather than by index arithmetic: the timeline is
 * hourly but not guaranteed contiguous, since a long uploader outage leaves a
 * stretch that no run covers.
 */
function findJump(
	slots: readonly ElmeteoSlot[],
	index: number,
	hours: number,
): number | undefined {
	const target = slots[index].at.getTime() + hours * millisecondsPerHour;
	if (target < slots[0].at.getTime()) {
		return undefined;
	}
	if (target > slots[slots.length - 1].at.getTime()) {
		return undefined;
	}
	return findSlotIndex(slots, new Date(target));
}

/**
 * Index of the next/previous local day, keeping the same hour when possible.
 * Falls back to the first/last slot of the timeline at its edges.
 */
function findDayIndex(
	slots: readonly ElmeteoSlot[],
	index: number,
	direction: 1 | -1,
) {
	const sameHour = findJump(slots, index, direction * 24);
	if (sameHour !== undefined) {
		return sameHour;
	}
	// Same hour is outside the timeline: settle for the closest slot that is
	// still in another day, so the button never feels dead while a day is left.
	const edge = direction === 1 ? slots.length - 1 : 0;
	const currentDay = romeDayKey.format(slots[index].at);
	return romeDayKey.format(slots[edge].at) === currentDay ? undefined : edge;
}

export function TimeControls({
	slots,
	index,
	onIndexChange,
}: TimeControlsProps) {
	const t = useTranslations("MeteoPage.Maps");
	const locale = useLocale();
	const rome = romeFormatters(locale);
	const current = slots[index];
	const previousDay = findDayIndex(slots, index, -1);
	const nextDay = findDayIndex(slots, index, 1);

	return (
		<div className="rounded-xl border bg-card p-3 sm:p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center justify-between gap-2 sm:justify-start">
					<Button
						variant="outline"
						size="icon"
						aria-label={t("previous_day")}
						disabled={previousDay === undefined}
						onClick={() =>
							previousDay !== undefined && onIndexChange(previousDay)
						}
					>
						<ChevronsLeft className="size-4" />
					</Button>

					<div className="flex-1 text-center sm:min-w-[13rem] sm:flex-none">
						<p className="font-semibold text-lg leading-tight tabular-nums">
							{rome.time.format(current.at)}
						</p>
						<p className="text-muted-foreground text-xs capitalize">
							{rome.day.format(current.at)}
						</p>
					</div>

					<Button
						variant="outline"
						size="icon"
						aria-label={t("next_day")}
						disabled={nextDay === undefined}
						onClick={() => nextDay !== undefined && onIndexChange(nextDay)}
					>
						<ChevronsRight className="size-4" />
					</Button>
				</div>

				<div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center">
					{[...hourJumps].reverse().map((hours, position) => {
						const target = findJump(slots, index, -hours);
						return (
							<JumpButton
								key={`back-${hours}`}
								label={`-${hours}h`}
								// The single-hour step is the one reached for most, so it reads
								// as the filled anchor at the centre of the desktop ladder.
								variant={hours === 1 ? "secondary" : "outline"}
								className={backwardMobileOrder[position]}
								disabled={target === undefined}
								onClick={() => target !== undefined && onIndexChange(target)}
							/>
						);
					})}

					{hourJumps.map((hours, position) => {
						const target = findJump(slots, index, hours);
						return (
							<JumpButton
								key={`forward-${hours}`}
								label={`+${hours}h`}
								variant={hours === 1 ? "secondary" : "outline"}
								className={cn(
									forwardMobileOrder[position],
									hours === 1 && "sm:ml-1",
								)}
								disabled={target === undefined}
								onClick={() => target !== undefined && onIndexChange(target)}
							/>
						);
					})}
				</div>
			</div>

			<div className="mt-3 flex items-center gap-3">
				<input
					type="range"
					min={0}
					max={slots.length - 1}
					value={index}
					aria-label={t("forecast_hour")}
					onChange={(event) => onIndexChange(Number(event.target.value))}
					className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
				/>
				{/* Lead time of the frame within its own run: the shorter it is, the
				    more reliable the forecast. */}
				<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
					+{current.step}h
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
