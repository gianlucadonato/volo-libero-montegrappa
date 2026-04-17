"use client";

import {
	ArrowLeft,
	Flag,
	MapPinIcon,
	MountainSnow,
	Navigation,
	Route,
	Target,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import XcFlightChart from "@/components/xc/XcFlightChart";
import XcTaskActionButtons from "@/components/xc/XcTaskActionButtons";
import XcTaskInteractivePanel from "@/components/xc/XcTaskInteractivePanel";
import XcTrackSubmission from "@/components/xc/XcTrackSubmission";
import { useGetXcTask, useGetXcTrack } from "@/hooks/use-query-api";
import { authClient } from "@/lib/auth-client";
import {
	type ParsedTask,
	parseTskXml,
	type TaskWaypoint,
} from "@/lib/tsk-parser";

const WAYPOINT_TYPE_ICON: Record<string, React.ReactNode> = {
	takeoff: <MountainSnow className="size-4 text-amber-500" />,
	sss: <Navigation className="size-4 text-green-500" />,
	ess: <Flag className="size-4 text-blue-500" />,
	goal: <Target className="size-4 text-red-500" />,
	turnpoint: <Route className="size-4 text-purple-500" />,
};

const WAYPOINT_TYPE_COLOR: Record<string, string> = {
	takeoff: "bg-amber-500/10 text-amber-600 border-amber-500/30",
	sss: "bg-green-500/10 text-green-600 border-green-500/30",
	ess: "bg-blue-500/10 text-blue-600 border-blue-500/30",
	goal: "bg-red-500/10 text-red-600 border-red-500/30",
	turnpoint: "bg-purple-500/10 text-purple-600 border-purple-500/30",
};

function haversineKm(a: TaskWaypoint, b: TaskWaypoint): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const earthRadiusKm = 6371;

	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lon - a.lon);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

	return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function legDistanceBetweenBuoysKm(
	prev: TaskWaypoint | undefined,
	curr: TaskWaypoint,
): number {
	if (!prev) return 0;
	const centerDistanceKm = haversineKm(prev, curr);
	const prevRadiusKm = (prev.radiusM || 0) / 1000;
	const currRadiusKm = (curr.radiusM || 0) / 1000;
	return Math.max(0, centerDistanceKm - prevRadiusKm - currRadiusKm);
}

interface XcTaskDetailsPageProps {
	taskId: string;
}

export default function XcTaskDetailsPage({ taskId }: XcTaskDetailsPageProps) {
	const t = useTranslations("TaskPage");
	const { data: task, isLoading } = useGetXcTask(taskId);
	const { data: session } = authClient.useSession();
	const isLoggedIn = Boolean(session?.user);
	const { data: track } = useGetXcTrack(taskId, isLoggedIn);

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

	const [parsedTask, setParsedTask] = useState<ParsedTask>({
		waypoints: [],
	});
	const [isTskLoading, setIsTskLoading] = useState(false);

	useEffect(() => {
		if (!task?.taskFileUrl) return;

		setIsTskLoading(true);
		fetch(task.taskFileUrl)
			.then((res) => res.text())
			.then((xml) => {
				setParsedTask(parseTskXml(xml));
			})
			.catch(console.error)
			.finally(() => setIsTskLoading(false));
	}, [task?.taskFileUrl]);

	const waypoints = parsedTask.waypoints;
	const legDistancesKm = useMemo(
		() =>
			waypoints.map((wp, idx) =>
				legDistanceBetweenBuoysKm(waypoints[idx - 1], wp),
			),
		[waypoints],
	);

	if (isLoading || isTskLoading) {
		return (
			<section className="pt-5 pb-20 sm:px-4 sm:pt-10">
				<div className="container mx-auto max-w-5xl">
					<Skeleton className="mb-4 h-9 w-24" />
					<Skeleton className="mb-2 h-8 w-72" />
					<Skeleton className="mb-6 h-5 w-96" />
					<Skeleton className="mb-4 h-100 w-full rounded-xl" />
					<Skeleton className="h-24 w-full rounded-xl" />
				</div>
			</section>
		);
	}

	if (!task || !task.name) {
		return (
			<section className="pt-5 pb-20 sm:px-4 sm:pt-10">
				<div className="container mx-auto max-w-5xl">
					<div>{t("not_found")}</div>
				</div>
			</section>
		);
	}

	return (
		<section className="pt-5 pb-20 sm:px-4 sm:pt-10">
			<div className="container mx-auto max-w-5xl">
				<div className="mb-4 flex justify-start">
					<Link href={`/xc/${task.category.toLowerCase()}`}>
						<Button variant="outline" size="sm">
							<ArrowLeft className="mr-2 size-4" />
							{t("back")}
						</Button>
					</Link>
				</div>

				<div className="mb-6">
					<DashboardHeader
						heading={
							<div className="flex items-center gap-2">
								<MapPinIcon className="size-5" />
								<span>{task.name}</span>
							</div>
						}
						text={task.description ?? ""}
					/>
				</div>

				{waypoints.length > 0 ? (
					<>
						<XcTaskInteractivePanel
							waypoints={waypoints}
							legDistancesKm={legDistancesKm}
							waypointTypeColor={WAYPOINT_TYPE_COLOR}
							waypointTypeIcon={WAYPOINT_TYPE_ICON}
							dashboardTitle={t("dashboard_title")}
							category={task.category}
							points={task.points}
							distanceKm={task.distanceKm}
							description={task.description}
							taskInfo={parsedTask.info}
							trackCoordinates={trackCoordinates}
							hoveredTrackPosition={hoveredTrackPosition}
						/>
						{track?.fixes && track.fixes.length > 0 && (
							<div className="mt-6">
								<XcFlightChart
									fixes={track.fixes}
									onHoverIndex={handleChartHover}
								/>
							</div>
						)}
						<div className="mt-4 mb-8">
							<XcTaskActionButtons
								taskId={taskId}
								taskFileUrl={task.taskFileUrl}
							/>
						</div>
						{track && (
							<div className="mb-8">
								<XcTrackSubmission header={track.header} stats={track.stats} />
							</div>
						)}
					</>
				) : (
					<div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
						{t("no_waypoints")}
					</div>
				)}
			</div>
		</section>
	);
}
