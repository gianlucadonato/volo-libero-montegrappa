"use client";

import {
	ArrowLeft,
	CheckCircle2,
	Clock,
	Medal,
	Mountain,
	Plane,
	Route,
	Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { DiceBearAvatar } from "@/components/DiceBearAvatar";
import Spinner from "@/components/Spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import XcLevelProgress from "@/components/xc/XcLevelProgress";
import XcPilotFlightsList from "@/components/xc/XcPilotFlightsList";
import { useGetXcPilotProfile } from "@/hooks/use-query-api";
import { cn } from "@/lib/utils";
import type {
	XcPilotCategoryStatsApi,
	XcPilotFlightApi,
} from "@/types/api-schema";

interface XcPilotProfileProps {
	userId: string;
	/** Rendered while the API call is in flight, so the name never flashes. */
	fallbackName: string;
}

/** One neutral panel for every category; the metal only shows on selection. */
const PANEL_CLASS = "bg-slate-200";

/** Bronze / silver / gold, used for the selected-card highlight ring. */
const CATEGORY_RING: Record<string, string> = {
	BASIC: "ring-orange-500",
	INTERMEDIATE: "ring-slate-500",
	ADVANCED: "ring-amber-500",
};

const FALLBACK_RING = "ring-slate-400";

export default function XcPilotProfile({
	userId,
	fallbackName,
}: XcPilotProfileProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const t = useTranslations("XcPilotProfilePage");
	const tCat = useTranslations("XcCategoryPage");

	const editionParam = searchParams.get("edition");
	const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

	const {
		data: profile,
		isLoading,
		error,
	} = useGetXcPilotProfile(
		userId,
		editionParam ? Number(editionParam) : undefined,
	);

	const flights = useMemo(
		() => (profile?.flights ?? []) as XcPilotFlightApi[],
		[profile?.flights],
	);

	const visibleFlights = useMemo(
		() =>
			categoryFilter === "ALL"
				? flights
				: flights.filter((f) => f.task.category === categoryFilter),
		[flights, categoryFilter],
	);

	const handleEditionChange = (value: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set("edition", value);
		router.replace(`/xc/users/${userId}?${next.toString()}`, { scroll: false });
	};

	const pilotName = profile
		? `${profile.user.firstName} ${profile.user.lastName}`
		: fallbackName;

	const selectedEditionId = profile?.edition?.id ?? null;

	return (
		<div className="min-h-screen bg-linear-to-b from-indigo-50 to-white">
			<div className="mx-auto max-w-4xl px-4 py-8">
				<div className="mb-6 flex flex-wrap items-center gap-2">
					<Link href="/xc/basic/leaderboard">
						<Button variant="outline">
							<ArrowLeft className="mr-2 size-4" />
							{t("backToLeaderboard")}
						</Button>
					</Link>
				</div>

				{/* Hero */}
				<div className="overflow-hidden rounded-2xl bg-linear-to-b from-indigo-600 to-indigo-800 px-6 py-8 shadow-xl">
					<div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
						<DiceBearAvatar
							seed={pilotName}
							alt={pilotName}
							className="size-20 shrink-0 ring-2 ring-white/30 sm:size-24"
						/>
						<div className="min-w-0">
							<p className="text-xs uppercase tracking-widest text-indigo-200">
								{t("subtitle")}
							</p>
							<h1 className="truncate font-heading text-2xl font-bold uppercase text-white sm:text-3xl">
								{pilotName}
							</h1>
							{profile && profile.totals.levelsCompleted > 0 && (
								<Badge className="mt-2 bg-amber-400 text-amber-950 hover:bg-amber-400">
									<Medal className="mr-1 size-3.5" />
									{t("totals.levelsCompleted", {
										count: profile.totals.levelsCompleted,
									})}
								</Badge>
							)}
						</div>
					</div>

					{profile && (
						<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
							<StatTile
								icon={<Plane className="size-4" />}
								label={t("totals.flights")}
								value={profile.totals.flights.toLocaleString()}
							/>
							<StatTile
								icon={<Route className="size-4" />}
								label={t("totals.distance")}
								value={`${Math.round(profile.totals.totalDistanceKm)} km`}
							/>
							<StatTile
								icon={<Clock className="size-4" />}
								label={t("totals.flightTime")}
								value={`${profile.totals.flightTimeHrs.toFixed(1)} h`}
							/>
							<StatTile
								icon={<Mountain className="size-4" />}
								label={t("totals.maxAlt")}
								value={`${Math.round(profile.totals.maxAltM)} m`}
							/>
						</div>
					)}
				</div>

				{isLoading && (
					<div className="flex items-center justify-center py-16">
						<Spinner />
					</div>
				)}

				{error && (
					<Card className="mt-6">
						<CardContent className="pt-6 text-center">
							<p className="font-semibold text-red-600">
								{t("errors.failedToLoad")}
							</p>
						</CardContent>
					</Card>
				)}

				{!isLoading && !error && profile && (
					<>
						{/* Edition selector */}
						{profile.editions.length > 0 && (
							<div className="my-6 flex items-center justify-center">
								<Select
									value={
										selectedEditionId ? String(selectedEditionId) : undefined
									}
									onValueChange={handleEditionChange}
								>
									<SelectTrigger className="h-10 bg-white">
										<SelectValue placeholder={t("selectEdition")} />
									</SelectTrigger>
									<SelectContent>
										{profile.editions.map((ed) => (
											<SelectItem key={ed.id} value={String(ed.id)}>
												{ed.title}
												{ed.isActive ? " ★" : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						{profile.editions.length === 0 ? (
							<p className="mt-8 rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
								{t("noData")}
							</p>
						) : (
							<>
								{/* Category cards */}
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{profile.categories.map((category) => (
										<CategoryCard
											key={category.category}
											stats={category as XcPilotCategoryStatsApi}
											selected={categoryFilter === category.category}
											onSelect={() =>
												setCategoryFilter((current) =>
													current === category.category
														? "ALL"
														: category.category,
												)
											}
											levelLabel={tCat("progress.level")}
											levelName={tCat(
												`categories.${category.category.toLowerCase()}.short`,
											)}
											tasksLabel={tCat("progress.tasksCompleted")}
											rankLabel={t("categories.rank")}
											completedLabel={t("categories.completed")}
											noDataLabel={t("categories.noData")}
										/>
									))}
								</div>

								{/* Flights */}
								<div className="mt-8">
									<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
										<h2 className="font-heading text-lg font-bold text-slate-900">
											{t("flights.title")}
										</h2>
										<div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
											{["ALL", "BASIC", "INTERMEDIATE", "ADVANCED"].map(
												(level) => (
													<button
														key={level}
														type="button"
														onClick={() => setCategoryFilter(level)}
														className={cn(
															"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
															categoryFilter === level
																? "bg-primary text-primary-foreground shadow-sm"
																: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
														)}
													>
														{level === "ALL"
															? t("flights.all")
															: tCat(`categories.${level.toLowerCase()}.short`)}
													</button>
												),
											)}
										</div>
									</div>

									<XcPilotFlightsList flights={visibleFlights} />
								</div>
							</>
						)}
					</>
				)}
			</div>
		</div>
	);
}

function StatTile({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
			<div className="flex items-center gap-1.5 text-xs text-indigo-100">
				{icon}
				{label}
			</div>
			<p className="font-heading text-lg font-bold text-white">{value}</p>
		</div>
	);
}

function CategoryCard({
	stats,
	selected,
	onSelect,
	levelLabel,
	levelName,
	tasksLabel,
	rankLabel,
	completedLabel,
	noDataLabel,
}: {
	stats: XcPilotCategoryStatsApi;
	selected: boolean;
	onSelect: () => void;
	levelLabel: string;
	levelName: string;
	tasksLabel: string;
	rankLabel: string;
	completedLabel: string;
	noDataLabel: string;
}) {
	const hasData = stats.points > 0 || stats.tasksCompleted > 0;
	const ring = CATEGORY_RING[stats.category] ?? FALLBACK_RING;

	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={selected}
			className={cn(
				"overflow-hidden rounded-xl border border-gray-200 text-left shadow-sm transition-shadow hover:shadow-md",
				selected && cn("ring-2 ring-offset-2", ring),
				!hasData && "opacity-60",
			)}
		>
			<div className={cn("px-4 py-6", PANEL_CLASS)}>
				<div className="mb-2 flex min-h-6 items-center justify-center">
					{stats.rank !== null && (
						<span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700">
							<Trophy className="size-3 text-amber-500" />
							{rankLabel} #{stats.rank}
							{stats.totalPilots > 0 && (
								<span className="text-slate-500">/{stats.totalPilots}</span>
							)}
						</span>
					)}
				</div>
				<XcLevelProgress
					level={levelName}
					levelLabel={levelLabel}
					points={stats.points}
					minPoints={stats.minPoints}
					maxPoints={stats.maxPoints}
					completedTasks={stats.tasksCompleted}
					totalTasks={stats.tasksTotal}
					variant="light"
				/>
			</div>
			<div className="space-y-2 bg-gray-50 px-4 py-3">
				{hasData ? (
					<>
						<p className="text-sm font-semibold text-gray-700">
							{stats.tasksCompleted}/{stats.tasksTotal}{" "}
							<span className="font-normal text-gray-500">{tasksLabel}</span>
						</p>
						<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
							<div
								className="h-full rounded-full bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400"
								style={{
									width: `${stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0}%`,
								}}
							/>
						</div>
						{stats.completedAt && (
							<p className="flex items-center gap-1.5 text-sm font-medium text-green-600">
								<CheckCircle2 className="size-4" />
								{completedLabel}
							</p>
						)}
					</>
				) : (
					<p className="text-sm text-gray-500">{noDataLabel}</p>
				)}
			</div>
		</button>
	);
}
