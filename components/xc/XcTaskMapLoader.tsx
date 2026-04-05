"use client";

import dynamic from "next/dynamic";
import type { TaskWaypoint } from "@/lib/tsk-parser";

const XcTaskMap = dynamic(() => import("@/components/xc/XcTaskMap"), {
	ssr: false,
	loading: () => (
		<div className="h-120 w-full animate-pulse rounded-xl bg-muted" />
	),
});

export default function XcTaskMapLoader({
	waypoints,
	className,
}: {
	waypoints: TaskWaypoint[];
	className?: string;
}) {
	return <XcTaskMap waypoints={waypoints} className={className} />;
}
