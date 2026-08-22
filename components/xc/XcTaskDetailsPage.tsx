"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EnrollButton from "@/components/xc/EnrollXcEditionButton";
import XcSubmissionHistory from "@/components/xc/XcSubmissionHistory";
import XcTaskActionButtons from "@/components/xc/XcTaskActionButtons";
import XcTaskInteractivePanel from "@/components/xc/XcTaskInteractivePanel";
import XcTrackSubmission from "@/components/xc/XcTrackSubmission";
import {
	WAYPOINT_TYPE_COLOR,
	WAYPOINT_TYPE_ICON,
} from "@/components/xc/xc-waypoint-styles";
import { NEXT_YEAR } from "@/config/constants";
import {
	useGetXcEnrollment,
	useGetXcSubmissionTrack,
	useGetXcTask,
} from "@/hooks/use-query-api";
import { useXcTaskWaypoints } from "@/hooks/use-xc-task-waypoints";
import { authClient } from "@/lib/auth-client";

interface XcTaskDetailsPageProps {
	taskId: string;
}

export default function XcTaskDetailsPage({ taskId }: XcTaskDetailsPageProps) {
	const t = useTranslations("TaskPage");
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const isLoggedIn = Boolean(session?.user);
	const { data: task, isLoading } = useGetXcTask(taskId);
	const { data: enrollment } = useGetXcEnrollment(isLoggedIn);
	const isEnrolled = Boolean(enrollment);

	const submissions = task?.submissions ?? [];
	const currentSubmission = useMemo(
		() => submissions.find((s) => s.editionId === NEXT_YEAR) ?? null,
		[submissions],
	);
	const hasHistory = submissions.some((s) => s.editionId !== NEXT_YEAR);

	// Which submission's track is currently displayed on the map/chart.
	// Defaults to the current edition submission once known.
	const [selectedSubmissionId, setSelectedSubmissionId] = useState<
		string | null
	>(null);

	const isViewingCurrentEdition =
		!selectedSubmissionId || selectedSubmissionId === currentSubmission?.id;

	useEffect(() => {
		if (currentSubmission && selectedSubmissionId === null) {
			setSelectedSubmissionId(currentSubmission.id);
		} else if (
			selectedSubmissionId &&
			!submissions.some((s) => s.id === selectedSubmissionId)
		) {
			setSelectedSubmissionId(null);
		}
	}, [currentSubmission, selectedSubmissionId, submissions]);

	const { data: track } = useGetXcSubmissionTrack(
		selectedSubmissionId ?? undefined,
		isLoggedIn && Boolean(selectedSubmissionId),
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

	const handleUploadSuccess = useCallback(() => {
		setSelectedSubmissionId(null);
		setHoveredFixIndex(null);
		queryClient.invalidateQueries({
			queryKey: ["get", "/xc/tasks/{id}", { params: { path: { id: taskId } } }],
		});
		queryClient.removeQueries({ queryKey: ["xc", "submission-track"] });
		queryClient.invalidateQueries({
			queryKey: ["get", "/xc/{category}/submissions"],
		});
		queryClient.invalidateQueries({
			queryKey: ["get", "/xc/{category}/progress"],
		});
	}, [queryClient, taskId]);

	const {
		waypoints,
		legDistancesKm,
		taskInfo,
		isLoading: isTskLoading,
	} = useXcTaskWaypoints(task?.taskFileUrl);

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
							taskInfo={taskInfo}
							trackCoordinates={trackCoordinates}
							hoveredTrackPosition={hoveredTrackPosition}
							trackFixes={track?.fixes}
							onChartHoverIndex={handleChartHover}
							taskId={taskId}
							taskFileUrl={task.taskFileUrl}
							slug={task.slug}
						/>
						{isViewingCurrentEdition && (
							<div className="my-4">
								<XcTaskActionButtons
									taskId={taskId}
									taskFileUrl={task.taskFileUrl}
									slug={task.slug}
									category={task.category}
									submission={currentSubmission}
									onUploadSuccess={handleUploadSuccess}
								/>
							</div>
						)}
						{!isEnrolled && (
							<div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
								<p className="mb-4 text-gray-600">{t("enroll_prompt")}</p>
								<EnrollButton />
							</div>
						)}
						{track && (
							<div className="mt-4 mb-8">
								<XcTrackSubmission header={track.header} stats={track.stats} />
							</div>
						)}
						{hasHistory && (
							<div className="mb-8">
								<XcSubmissionHistory
									submissions={submissions}
									selectedSubmissionId={selectedSubmissionId}
									onSelect={setSelectedSubmissionId}
								/>
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
