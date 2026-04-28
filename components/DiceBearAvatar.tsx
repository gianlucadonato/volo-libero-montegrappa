"use client";

import { botttsNeutral } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DiceBearAvatarProps {
	seed: string;
	className?: string;
	alt?: string;
}

export function DiceBearAvatar({ seed, className, alt }: DiceBearAvatarProps) {
	const svg = useMemo(
		() => createAvatar(botttsNeutral, { seed }).toString(),
		[seed],
	);

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
