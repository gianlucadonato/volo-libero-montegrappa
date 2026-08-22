"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import XcTaskInteractivePanel from "@/components/xc/XcTaskInteractivePanel";
import XcTrackSubmission from "@/components/xc/XcTrackSubmission";
import {
	WAYPOINT_TYPE_COLOR,
	WAYPOINT_TYPE_ICON,
} from "@/components/xc/xc-waypoint-styles";
import { useGetXcSubmissionTrack } from "@/hooks/use-query-api";
import { useXcTaskWaypoints } from "@/hooks/use-xc-task-waypoints";
import type { XcPilotFlightApi } from "@/types/api-schema";

interface XcPilotFlightPanelProps {
	flight: XcPilotFlightApi;
}

/**
 * Map + elevation chart + stats for one approved flight of a pilot. Reads the
 * track from the public `/xc/submissions/[id]` endpoint, so it works for
 * visitors who are not logged in.
 */
export default function XcPilotFlightPanel({
	flight,
}: XcPilotFlightPanelProps) {
	const t = useTranslations("TaskPage");
	const tProfile = useTranslations("XcPilotProfilePage");

	const {
		waypoints,
		legDistancesKm,
		taskInfo,
		isLoading: isTaskLoading,
	} = useXcTaskWaypoints(flight.task.taskFileUrl);

	const { data: track, isLoading: isTrackLoading } = useGetXcSubmissionTrack(
		flight.id,
		true,
	);

	const trackCoordinates = useMemo(
		() =>
			track?.fixes
				?.filter((f) => f.valid)
				.map((f) => [f.latitude, f.longitude] as [number, number]) ?? [],
		[track?.fixes],
	);

	const [hoveredFixIndex, setHoveredFixIndex] = useState<number | null>(null);

	const hoveredTrackPosition = useMemo(() => {
		if (hoveredFixIndex == null || !trackCoordinates[hoveredFixIndex])
			return null;
		return trackCoordinates[hoveredFixIndex];
	}, [hoveredFixIndex, trackCoordinates]);

	const handleChartHover = useCallback((index: number | null) => {
		setHoveredFixIndex(index);
	}, []);

	if (isTaskLoading || isTrackLoading) {
		return <Skeleton className="h-100 w-full rounded-xl" />;
	}

	if (waypoints.length === 0) {
		return (
			<div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
				{t("no_waypoints")}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<XcTaskInteractivePanel
				waypoints={waypoints}
				legDistancesKm={legDistancesKm}
				waypointTypeColor={WAYPOINT_TYPE_COLOR}
				waypointTypeIcon={WAYPOINT_TYPE_ICON}
				dashboardTitle={t("dashboard_title")}
				category={flight.task.category}
				points={flight.task.points}
				distanceKm={flight.task.distanceKm}
				description={flight.task.name}
				taskInfo={taskInfo}
				trackCoordinates={trackCoordinates}
				hoveredTrackPosition={hoveredTrackPosition}
				trackFixes={track?.fixes}
				onChartHoverIndex={handleChartHover}
				taskId={flight.task.id}
				taskFileUrl={flight.task.taskFileUrl}
				slug={flight.task.slug}
			/>
			{track ? (
				<XcTrackSubmission header={track.header} stats={track.stats} />
			) : (
				<p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
					{tProfile("flights.trackUnavailable")}
				</p>
			)}
		</div>
	);
}
