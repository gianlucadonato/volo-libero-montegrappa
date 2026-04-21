"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EnrollButton from "@/components/xc/EnrollXcEditionButton";
import XcCelebrationCard from "@/components/xc/XcCelebrationCard";
import XcLevelProgress from "@/components/xc/XcLevelProgress";
import XcTaskCard from "@/components/xc/XcTaskCard";
import {
	useGetProgressByCategory,
	useGetXcEdition,
	useGetXcEnrollment,
	useGetXcSubmissionsByCategory,
} from "@/hooks/use-query-api";
import { authClient } from "@/lib/auth-client";
import type { XcSubmissionApi } from "@/types/api-schema";

const categories = [
	{ level: "basic", icon: "🥉" },
	{ level: "intermediate", icon: "🥈" },
	{ level: "advanced", icon: "🥇" },
] as const;

const validLevels = new Set(categories.map((c) => c.level));

export default function CategoryPage() {
	const params = useParams();
	const router = useRouter();
	const t = useTranslations("XcCategoryPage");
	const { data: session } = authClient.useSession();
	const isLoggedIn = !!session?.user;
	const currentLevel = String(params.category).toLowerCase();

	if (!validLevels.has(currentLevel as (typeof categories)[number]["level"])) {
		notFound();
	}

	const {
		isLoading: isLoadingEdition,
		data: edition,
		error: editionError,
	} = useGetXcEdition(currentLevel);
	const tasks = edition?.tasks;
	const minPointsForLevel = edition
		? currentLevel === "basic"
			? edition.basicMinPoints
			: currentLevel === "intermediate"
				? edition.interMinPoints
				: edition.advMinPoints
		: 0;
	const { isLoading: isLoadingProgress, data: xcProgress } =
		useGetProgressByCategory(currentLevel, isLoggedIn);
	const { isLoading: isLoadingEnrollment, data: xcEnrollment } =
		useGetXcEnrollment(isLoggedIn);
	const { data: submissions } = useGetXcSubmissionsByCategory(
		currentLevel,
		isLoggedIn,
	);

	const submissionsByTaskId = useMemo(() => {
		const map = new Map<string, XcSubmissionApi>();
		for (const sub of submissions ?? []) {
			map.set(sub.taskId, sub);
		}
		return map;
	}, [submissions]);

	if (isLoadingEdition) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (editionError) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="text-center pt-6">
						<p className="text-red-600 font-semibold mb-4">
							{t("errors.failedToLoad")}
						</p>
						<Link href="/xc">
							<Button variant="outline" className="w-full">
								<ArrowLeft className="mr-2 size-4" />
								{t("buttons.backToXc")}
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Back + Category Tabs */}
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Link href="/xc">
						<Button variant="outline">
							<ArrowLeft className="mr-2 size-4" />
							{t("buttons.back")}
						</Button>
					</Link>

					<div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
						{categories.map((cat) => (
							<button
								key={cat.level}
								type="button"
								onClick={() => router.push(`/xc/${cat.level}`)}
								className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
									currentLevel === cat.level
										? "bg-primary text-primary-foreground shadow-sm"
										: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
								}`}
							>
								<span>{cat.icon}</span>
								<span className="hidden sm:inline">
									{t(`categories.${cat.level}.title`)}
								</span>
								<span className="sm:hidden">
									{t(`categories.${cat.level}.short`)}
								</span>
							</button>
						))}
					</div>
				</div>

				{/* Level Status Card */}
				{isLoadingProgress && (
					<div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
						<div className="flex flex-col items-center p-8">
							<Skeleton className="size-44 rounded-full" />
							<Skeleton className="mt-4 h-4 w-32" />
						</div>
						<div className="border-t border-gray-100 px-6 py-4">
							<Skeleton className="h-3 w-full rounded-full" />
						</div>
					</div>
				)}

				{!isLoadingProgress &&
					(() => {
						const completedTasks =
							submissions?.filter((s) => s.status === "APPROVED").length ?? 0;
						const totalTasks = tasks?.length ?? 0;
						const points = xcProgress?.points ?? 0;
						const minPoints = xcProgress?.minPoints ?? minPointsForLevel;
						const progressPct =
							minPoints > 0 ? Math.min((points / minPoints) * 100, 100) : 0;

						return (
							<div className="mb-8 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
								{/* Main content */}
								<div
									className="relative bg-cover bg-center"
									style={{
										backgroundImage: "url('/background/panettone.jpg')",
									}}
								>
									<div className="absolute inset-0 bg-black/50" />
									<div className="relative flex flex-col items-center px-6 py-8">
										<h2 className="self-start text-lg font-semibold text-white mb-6">
											XC Montegrappa
										</h2>

										{/* Radial progress + medal */}
										<XcLevelProgress
											level={t(`categories.${currentLevel}.short`)}
											levelLabel={t("progress.level")}
											points={points}
											minPoints={minPoints}
											completedTasks={completedTasks}
											totalTasks={totalTasks}
										/>
									</div>
								</div>

								{/* Bottom bar */}
								<div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center">
									<div className="flex w-full flex-col gap-1.5 sm:w-1/2">
										<p className="text-sm font-semibold text-gray-700">
											{completedTasks}/{totalTasks}{" "}
											<span className="font-normal text-gray-500">
												{t("progress.tasksCompleted")}
											</span>
										</p>
										<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
											<div
												className="h-full rounded-full bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400 transition-all"
												style={{
													width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
												}}
											/>
										</div>
									</div>
									<div className="flex w-full flex-col gap-1.5 sm:w-1/2">
										<p className="text-sm font-semibold text-gray-700">
											{points}/{minPoints}{" "}
											<span className="font-normal text-gray-500">
												{t("progress.xcPoints")}
											</span>
											{xcProgress?.completedAt && (
												<span className="ml-2 block text-green-600 sm:inline">
													{t("progress.completed")}
												</span>
											)}
										</p>
										<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
											<div
												className="h-full rounded-full bg-linear-to-r from-cyan-400 via-lime-400 to-green-400 transition-all"
												style={{ width: `${progressPct}%` }}
											/>
										</div>
									</div>
								</div>
							</div>
						);
					})()}

				{/* Enroll prompt when no progress and not enrolled */}
				{!isLoadingProgress &&
					!xcProgress &&
					!isLoadingEnrollment &&
					!xcEnrollment && (
						<div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
							<p className="mb-4 text-gray-600">{t("enrollPrompt")}</p>
							<EnrollButton />
						</div>
					)}
				{Boolean(xcProgress?.completedAt) && (
					<XcCelebrationCard
						level={currentLevel}
						stats={{
							totalDistanceKm: xcProgress?.totalDistanceKm ?? 0,
							flightTimeHrs: Math.round(xcProgress?.flightTimeHrs ?? 0),
							maxAltM: Math.round(xcProgress?.maxAltM ?? 0),
						}}
					/>
				)}

				{/* Tasks Grid */}
				<div className="mb-8">
					{tasks?.length === 0 ? (
						<Card>
							<CardContent className="pt-6 text-center text-gray-500">
								{t("tasks.empty")}
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{tasks?.map((task) => (
								<XcTaskCard
									key={task.id}
									task={task}
									submission={submissionsByTaskId.get(task.id)}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
