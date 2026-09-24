"use client";

import type { ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * A forecast cell that opens its full reading in a dialog.
 *
 * The table can only carry one figure per cell — the thermals column shows the
 * ceiling a pilot plans around, the inversion column the base a climb stops at
 * — while the source publishes a whole list behind each. That list used to live
 * in a `title` attribute, which no touch device shows: on a phone, which is
 * where these tables are actually read, the extra reading simply did not exist.
 *
 * A dialog rather than a popover or tooltip because it is the one overlay that
 * opens the same way for a mouse, a keyboard and a thumb, and because the list
 * needs more room than a table column has. The trigger is a real button for the
 * same reason: it is reachable by tab and announces itself.
 */
export function ForecastDetailDialog({
	title,
	description,
	className,
	children,
	label,
}: {
	title: string;
	description?: ReactNode;
	className?: string;
	/** The dialog body: the full list the cell is summarising, when it has one. */
	children?: ReactNode;
	/** What the cell shows in the table — the summary figure. */
	label: ReactNode;
}) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<button
					type="button"
					className={cn(
						// Dotted underline: the long-standing "there is more here"
						// affordance, and the only one that does not cost column width.
						"cursor-pointer underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
						className,
					)}
				>
					{label}
				</button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && (
						<DialogDescription className="text-left">
							{description}
						</DialogDescription>
					)}
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
}
