"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

/**
 * Outcome of the last upload attempt, shown next to its timestamp.
 *
 * It reports the attempt, not the run on screen: when an upload fails the maps
 * fall back to the previous good run, and a green dot would then hide days of a
 * broken uploader behind a page that looks healthy.
 */
export function UploadStatusDot({ error }: { error: boolean }) {
	const label = error
		? "Ultimo aggiornamento fallito"
		: "Ultimo aggiornamento riuscito";

	return (
		<span
			// The wrapper has no text, so its synthesised baseline is its bottom
			// edge: the dot ends up sitting on the baseline, spanning the lower part
			// of the digits it follows rather than floating above them.
			className="ml-1.5 inline-flex items-center align-baseline"
			title={label}
		>
			<span
				className={cn(
					"size-2 rounded-full",
					error ? "bg-red-500" : "bg-green-700",
				)}
			/>
			<span className="sr-only">{label}</span>
		</span>
	);
}

/** Reloads the server component, and with it the runs behind the timeline. */
export function RefreshButton() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<button
			type="button"
			onClick={() => startTransition(() => router.refresh())}
			disabled={isPending}
			aria-label="Aggiorna i dati del meteo"
			title="Ricarica i dati del meteo"
			className="shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-progress"
		>
			<RefreshCw className={cn("size-4", isPending && "animate-spin")} />
		</button>
	);
}
