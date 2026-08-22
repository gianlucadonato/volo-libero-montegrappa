"use client";

import {
	CalendarDays,
	ChevronRight,
	MapPin,
	Mountain,
	Timer,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { XcPilotFlightApi } from "@/types/api-schema";

interface XcPilotFlightsListProps {
	flights: XcPilotFlightApi[];
}

export default function XcPilotFlightsList({
	flights,
}: XcPilotFlightsListProps) {
	const t = useTranslations("XcPilotProfilePage");
	const tCat = useTranslations("XcCategoryPage");

	if (flights.length === 0) {
		return (
			<p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
				{t("flights.empty")}
			</p>
		);
	}

	return (
		<ul className="flex flex-col gap-2">
			{flights.map((flight) => {
				const level = flight.task.category.toLowerCase();
				const flownOn = flight.stats?.startTime ?? flight.createdAt;

				return (
					<li key={flight.id}>
						<Link
							href={`/xc/flights/${flight.id}`}
							className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 sm:flex-row sm:items-center sm:justify-between"
						>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<Badge variant="outline">{flight.task.slug}</Badge>
									<span className="truncate font-medium text-slate-900">
										{flight.task.name}
									</span>
								</div>
								<div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
									<span className="flex items-center gap-1">
										<CalendarDays className="size-3" />
										{formatDate(flownOn)}
									</span>
									{flight.stats?.totalDistanceKm != null && (
										<span className="flex items-center gap-1">
											<MapPin className="size-3" />
											{flight.stats.totalDistanceKm.toFixed(1)} km
										</span>
									)}
									{flight.stats?.duration && (
										<span className="flex items-center gap-1">
											<Timer className="size-3" />
											{flight.stats.duration}
										</span>
									)}
									{flight.stats?.maxAltitude != null && (
										<span className="flex items-center gap-1">
											<Mountain className="size-3" />
											{Math.round(flight.stats.maxAltitude)} m
										</span>
									)}
								</div>
							</div>

							<div className="flex shrink-0 items-center gap-2">
								<Badge variant="secondary">
									{tCat(`categories.${level}.short`)}
								</Badge>
								<Badge>
									{flight.pointsAwarded} {t("flights.points")}
								</Badge>
								<span className="flex items-center gap-0.5 text-sm font-medium text-indigo-600">
									{t("flights.view")}
									<ChevronRight className="size-4" />
								</span>
							</div>
						</Link>
					</li>
				);
			})}
		</ul>
	);
}

function formatDate(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}
