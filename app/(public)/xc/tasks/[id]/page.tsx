import {
	ArrowLeft,
	Flag,
	MapPinIcon,
	MountainSnow,
	Navigation,
	Route,
	Star,
	Target,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type React from "react";
import getXcTaskById from "@/actions/xc/getXcTaskById";
import { DashboardHeader } from "@/components/dashboard/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import XcTaskMapLoader from "@/components/xc/XcTaskMapLoader";
import { constructMetadata, siteConfig } from "@/config/site";
import {
	type ParsedTask,
	parseTskXml,
	type TaskWaypoint,
} from "@/lib/tsk-parser";

export const metadata = constructMetadata({
	title: `Task - ${siteConfig.name}`,
	description: "Task details page",
});

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

async function fetchAndParseTask(taskFileUrl: string): Promise<ParsedTask> {
	const { readFileSync } = await import("fs");
	const { join } = await import("path");
	const filePath = join(process.cwd(), "public", taskFileUrl);
	const xml = readFileSync(filePath, "utf-8");
	return parseTskXml(xml);
}

export default async function TaskPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const task = await getXcTaskById(id);
	const t = await getTranslations("TaskPage");

	if (!task || !task.name) {
		return <div>{t("not_found")}</div>;
	}

	const parsedTask: ParsedTask = task.taskFileUrl
		? await fetchAndParseTask(task.taskFileUrl)
		: { waypoints: [] };

	const waypoints: TaskWaypoint[] = parsedTask.waypoints;
	const legDistancesKm = waypoints.map((wp, idx) =>
		legDistanceBetweenBuoysKm(waypoints[idx - 1], wp),
	);

	return (
		<section className="sm:px-4 pt-5 sm:pt-10 pb-20">
			<div className="container mx-auto max-w-5xl">
				{/* Back button */}
				<div className="mb-4 flex justify-start">
					<Link href={`/xc/${task.category.toLowerCase()}`}>
						<Button variant="outline" size="sm">
							<ArrowLeft className="mr-2 size-4" />
							{t("back")}
						</Button>
					</Link>
				</div>

				{/* Header */}
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

				{/* Map */}
				<div className="mb-6">
					<XcTaskMapLoader waypoints={waypoints} className="h-120" />
				</div>

				{/* Info + waypoints */}
				<div className="grid gap-6 md:grid-cols-2">
					{/* Task info card */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Star className="size-5 text-yellow-500" />
								{t("dashboard_title")}
							</CardTitle>
							<CardDescription>{task.description ?? ""}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Categoria</span>
								<Badge variant="outline" className="capitalize">
									{task.category.toLowerCase()}
								</Badge>
							</div>
							{task.distanceKm != null && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Distanza</span>
									<span className="font-medium">
										{task.distanceKm.toFixed(1)} km
									</span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-muted-foreground">Punti</span>
								<span className="font-semibold text-primary">
									{task.points}
								</span>
							</div>
							{waypoints.length > 0 && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">Waypoints</span>
									<span className="font-medium">{waypoints.length}</span>
								</div>
							)}
							{parsedTask.info && (
								<div className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
									{parsedTask.info}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Waypoints list card */}
					{waypoints.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Route className="size-5" />
									Waypoints
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{waypoints.map((wp, idx) => (
									<div key={idx}>
										{idx > 0 && <Separator className="my-2" />}
										<div className="flex items-start gap-3">
											<div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
												{idx + 1}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<span className="truncate font-medium text-sm">
														{wp.name}
													</span>
													<Badge
														variant="outline"
														className={`shrink-0 gap-1 text-xs ${WAYPOINT_TYPE_COLOR[wp.type] ?? ""}`}
													>
														{WAYPOINT_TYPE_ICON[wp.type]}
														{wp.type}
													</Badge>
												</div>
												<div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
													{wp.id && (
														<span>
															TP: <strong>{wp.id}</strong>
														</span>
													)}
													<span>R: {wp.radiusM.toFixed(0)} m</span>
													{wp.altM > 0 && <span>Alt: {wp.altM} m</span>}
													<span className="sm:ml-auto font-semibold text-foreground">
														{legDistancesKm[idx].toFixed(1)} km
													</span>
												</div>
											</div>
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</section>
	);
}
