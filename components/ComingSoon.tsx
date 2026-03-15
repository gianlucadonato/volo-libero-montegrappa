"use client";

import { SunSnow } from "lucide-react";
import { LineShadowText } from "@/components/ui/line-shadow-text";

export default function ComingSoon() {
	return (
		<div className="flex w-full flex-col items-center justify-center">
			<SunSnow className="size-10" />
			<h2 className="mt-4 text-xl font-semibold">This section is</h2>
			<div className="mt-4 text-balance text-3xl font-semibold leading-none tracking-tighter sm:text-5xl">
				<span className="mr-2 text-black">COMING</span>
				<LineShadowText className="italic" shadowColor="black">
					SOON
				</LineShadowText>
				<span className="ml-2 text-black">...</span>
			</div>
			<h2 className="mt-4 text-xl font-semibold">Stay tuned!</h2>
		</div>
	);
}
