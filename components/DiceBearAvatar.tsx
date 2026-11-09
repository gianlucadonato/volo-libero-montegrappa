"use client";

import { Avatar, Style } from "@dicebear/core";
import botttsNeutral from "@dicebear/styles/bottts-neutral.json";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

// Parsed once: every avatar on the page shares the same style.
const style = new Style(botttsNeutral);

interface DiceBearAvatarProps {
	seed: string;
	className?: string;
	alt?: string;
}

export function DiceBearAvatar({ seed, className, alt }: DiceBearAvatarProps) {
	const svg = useMemo(() => new Avatar(style, { seed }).toString(), [seed]);

	return (
		<span
			role="img"
			aria-label={alt ?? seed}
			className={cn(
				"inline-block overflow-hidden rounded-full bg-white [&>svg]:size-full",
				className,
			)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted DiceBear-generated SVG
			dangerouslySetInnerHTML={{ __html: svg }}
		/>
	);
}
