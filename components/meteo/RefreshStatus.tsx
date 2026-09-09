"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

type RefreshStatusProps = {
	/** Whether the last upload attempt failed, whatever its run. */
	error: boolean;
};

/**
 * Refresh button carrying the outcome of the last upload attempt.
 *
 * The dot reports the attempt, not the run on screen: when an upload fails the
 * maps fall back to the previous good run, and a green dot would then hide days
 * of a broken uploader behind a page that looks healthy.
 */
export function RefreshStatus({ error }: RefreshStatusProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<button
			type="button"
			// `router.refresh` re-runs the server component and hands down fresh
			// runs; the timeline is keyed on the hour, so the view stays put.
			onClick={() => startTransition(() => router.refresh())}
			disabled={isPending}
			aria-label="Aggiorna i dati del meteo"
			title={
				error
					? "Ultimo aggiornamento fallito. Clicca per ricaricare."
					: "Ultimo aggiornamento riuscito. Clicca per ricaricare."
			}
			className="relative mt-0.5 shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-progress"
		>
			<RefreshCw className={cn("size-4", isPending && "animate-spin")} />
			<span
				// Ringed in the card colour so the dot stays legible where it overlaps
				// the icon's own strokes.
				className={cn(
					"absolute -top-1 -right-1 size-2 rounded-full ring-2 ring-card",
					error ? "bg-red-500" : "bg-green-700",
				)}
			/>
			<span className="sr-only">
				{error
					? "Ultimo aggiornamento fallito"
					: "Ultimo aggiornamento riuscito"}
			</span>
		</button>
	);
}
