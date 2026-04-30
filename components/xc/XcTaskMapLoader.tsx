"use client";

import dynamic from "next/dynamic";
import type { IGCFix } from "@/lib/igc-parser";
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
	selectedWaypointIndex,
	trackCoordinates,
	hoveredTrackPosition,
	trackFixes,
	onChartHoverIndex,
}: {
	waypoints: TaskWaypoint[];
	className?: string;
	selectedWaypointIndex?: number | null;
	trackCoordinates?: [number, number][];
	hoveredTrackPosition?: [number, number] | null;
	trackFixes?: IGCFix[];
	onChartHoverIndex?: (index: number | null) => void;
}) {
	return (
		<XcTaskMap
			waypoints={waypoints}
			className={className}
			selectedWaypointIndex={selectedWaypointIndex}
			trackCoordinates={trackCoordinates}
			hoveredTrackPosition={hoveredTrackPosition}
			trackFixes={trackFixes}
			onChartHoverIndex={onChartHoverIndex}
		/>
	);
}
