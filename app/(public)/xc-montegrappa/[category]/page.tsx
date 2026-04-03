"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import getMyXcProgress from "@/actions/xc/getMyXcProgress";
import { getXcTasksByCategory } from "@/actions/xc/getXcTasks";
import Spinner from "@/components/Spinner";
import TaskBrevettoCard from "@/components/TaskBrevettoCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EnrollButton from "@/components/xc/EnrollButton";
import type { XcCategoryLevel } from "@/prisma/generated/enums";
import type { XcTaskData } from "@/types";

type XcProgress = Awaited<ReturnType<typeof getMyXcProgress>>;

const categoryConfig: Record<
	string,
	{ level: XcCategoryLevel; name: string; icon: string; color: string }
> = {
	basic: {
		level: "BASIC",
		name: "Brevetto Basico",
		icon: "🥉",
		color: "bg-bronze-50 border-bronze-200",
	},
	intermediate: {
		level: "INTERMEDIATE",
		name: "Brevetto Intermedio",
		icon: "🥈",
		color: "bg-slate-50 border-slate-200",
	},
	advanced: {
		level: "ADVANCED",
		name: "Brevetto Avanzato",
		icon: "🥇",
		color: "bg-yellow-50 border-yellow-200",
	},
};

export default function CategoryPage() {
	const params = useParams();
	const t = useTranslations("XcCategoryPage");
	const categoryParam = (params.category as string)?.toLowerCase();

	const config = categoryConfig[categoryParam];

	const [tasks, setTasks] = useState<XcTaskData[]>([]);
	const [progressData, setProgressData] = useState<XcProgress>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true);
				if (!config) {
					setError(t("errors.categoryNotFound"));
					return;
				}

				// Load tasks
				const tasksData = await getXcTasksByCategory(config.level);
				setTasks(tasksData);

				// Load user progress
				const progress = await getMyXcProgress();
				setProgressData(progress);
			} catch (err) {
				console.error("Error loading data:", err);
				setError(t("errors.failedToLoad"));
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [config, t]);

	if (!config) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="text-center pt-6">
						<p className="text-red-600 font-semibold mb-4">
							{t("errors.categoryNotFound")}
						</p>
						<Link href="/xc-montegrappa">
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

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="text-center pt-6">
						<p className="text-red-600 font-semibold mb-4">{error}</p>
						<Link href="/xc-montegrappa">
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

	// isEnrolled is at edition level (user enrolled once, accesses all categories)
	const isEnrolled = progressData?.isEnrolled ?? false;
	const categoryProgress = progressData?.categories?.find(
		(c) => c.level === config.level,
	);

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
			<div className="overflow-hidden">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/banner-panetun.jpg')] bg-cover bg-left">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-heading text-3xl uppercase text-white">
							{t("bannerTitle")}
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							{t("bannerSubtitle")}
						</h3>
					</div>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="mb-8">
					<Link href="/xc-montegrappa">
						<Button variant="outline" className="mb-4">
							<ArrowLeft className="mr-2 size-4" />
							{t("buttons.back")}
						</Button>
					</Link>

					<div className={`rounded-lg border-2 p-6 ${config.color}`}>
						<h1 className="text-4xl font-bold mb-2">
							{config.icon} {t(`categories.${categoryParam}.title`)}
						</h1>
						<p className="text-gray-600 text-lg">{t("header.description")}</p>
					</div>
				</div>

				{/* Progress Card */}
				{isEnrolled && categoryProgress && (
					<Card className="mb-8 bg-blue-50 border-blue-200">
						<CardHeader>
							<CardTitle>{t("progress.title")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<p className="text-sm text-gray-600">
									{t("progress.currentPoints")}
									<span className="font-bold text-lg">
										{categoryProgress.points}
									</span>
								</p>
								<p className="text-sm text-gray-600">
									{t("progress.minPoints")}
									<span className="font-bold text-lg">
										{categoryProgress.minPoints}
									</span>
								</p>
								<div className="w-full bg-gray-200 rounded-full h-3 mt-4">
									<div
										className="bg-green-500 h-3 rounded-full transition-all"
										style={{
											width: `${Math.min(
												(categoryProgress.points / categoryProgress.minPoints) *
													100,
												100,
											)}%`,
										}}
									></div>
								</div>
								{categoryProgress.completed && (
									<p className="text-green-600 font-semibold mt-2">
										{t("progress.completed")}
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{!isEnrolled && (
					<Card className="mb-8 bg-blue-50 border border-blue-200">
						<CardContent className="text-center pt-6">
							<p className="text-blue-800 mb-4">{t("enrollPrompt")}</p>
							<EnrollButton />
						</CardContent>
					</Card>
				)}

				{/* Tasks List */}
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-6">{t("tasks.title")}</h2>
					{tasks.length === 0 ? (
						<Card>
							<CardContent className="text-center pt-6 text-gray-500">
								{t("tasks.empty")}
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{tasks.map((task: XcTaskData) => (
								<TaskBrevettoCard
									key={task.id}
									task={task}
									isEnrolled={isEnrolled}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
