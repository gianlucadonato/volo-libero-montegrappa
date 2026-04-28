"use client";

import { Route, Star } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import XcTaskMapLoader from "@/components/xc/XcTaskMapLoader";
import type { TaskWaypoint } from "@/lib/tsk-parser";

interface XcTaskInteractivePanelProps {
	waypoints: TaskWaypoint[];
	legDistancesKm: number[];
	waypointTypeColor: Record<string, string>;
	waypointTypeIcon: Record<string, React.ReactNode>;
	dashboardTitle: string;
	category: string;
	points: number;
	distanceKm?: number | null;
	description?: string | null;
	taskInfo?: string;
	trackCoordinates?: [number, number][];
	hoveredTrackPosition?: [number, number] | null;
}

export default function XcTaskInteractivePanel({
	waypoints,
	legDistancesKm,
	waypointTypeColor,
	waypointTypeIcon,
	dashboardTitle,
	category,
	points,
	distanceKm,
	description,
	taskInfo,
	trackCoordinates,
	hoveredTrackPosition,
}: XcTaskInteractivePanelProps) {
	const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<
		number | null
	>(null);

	return (
		<>
			<div className="grid gap-6 md:grid-cols-2 mb-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Star className="size-5 text-yellow-500" />
							{dashboardTitle}
						</CardTitle>
						<CardDescription>{description ?? ""}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Categoria</span>
							<Badge variant="outline" className="capitalize">
								{category.toLowerCase()}
							</Badge>
						</div>
						{distanceKm != null && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Distanza</span>
								<span className="font-medium">{distanceKm.toFixed(1)} km</span>
							</div>
						)}
						<div className="flex justify-between items-center">
							<span className="text-muted-foreground">Punti</span>
							<span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-600">
								<Star className="size-4" />+{points} XC
							</span>
						</div>
						{waypoints.length > 0 && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Waypoints</span>
								<span className="font-medium">{waypoints.length}</span>
							</div>
						)}
						{taskInfo && (
							<div className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
								{taskInfo}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Route className="size-5" />
							Waypoints
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{waypoints.map((wp, idx) => {
							const isSelected = idx === selectedWaypointIndex;
							return (
								<div key={idx}>
									{idx > 0 && <Separator className="my-2" />}
									<button
										type="button"
										onClick={() =>
											setSelectedWaypointIndex((prev) =>
												prev === idx ? null : idx,
											)
										}
										className={`w-full rounded-md p-2 text-left transition-colors ${
											isSelected
												? "bg-cyan-500/10 ring-1 ring-cyan-500/40"
												: "hover:bg-muted/50"
										}`}
									>
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
														className={`shrink-0 gap-1 text-xs ${waypointTypeColor[wp.type] ?? ""}`}
													>
														{waypointTypeIcon[wp.type]}
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
									</button>
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>
			<div className="mb-6">
				<XcTaskMapLoader
					waypoints={waypoints}
					className="h-120"
					selectedWaypointIndex={selectedWaypointIndex}
					trackCoordinates={trackCoordinates}
					hoveredTrackPosition={hoveredTrackPosition}
				/>
			</div>
		</>
	);
}
