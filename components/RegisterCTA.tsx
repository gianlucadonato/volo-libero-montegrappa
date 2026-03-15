import { NotebookPen } from "lucide-react";
import Link from "next/link";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { NEXT_YEAR } from "@/config/constants";
import { cn } from "@/lib/utils";

export default function RegisterCTA() {
	return (
		<div className="h-[250px] w-full py-10">
			<div className="relative flex size-full flex-col items-center justify-center overflow-hidden bg-background">
				<div className="z-10 whitespace-pre-wrap">
					<div
						className={cn(
							"group rounded-full border border-black/5 bg-white text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-50 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800",
						)}
					>
						<AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 text-sm transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
							<span>🎉 Iscrizioni {NEXT_YEAR} aperte!</span>
						</AnimatedShinyText>
					</div>
					<div className="mt-4 text-center tracking-tighter text-black dark:text-white">
						<Link href="/membership">
							<ShimmerButton
								background="#1e40af"
								className="flex w-[185px] items-center justify-center"
							>
								<NotebookPen className="mr-2 size-4" />
								<span>Iscriviti qui!</span>
							</ShimmerButton>
						</Link>
					</div>
				</div>
				<DotPattern
					className={cn(
						"[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
					)}
					width={20}
					height={20}
					squares={[80, 80]}
				/>
			</div>
		</div>
	);
}
