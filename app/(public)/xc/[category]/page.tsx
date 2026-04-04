"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EnrollButton from "@/components/xc/EnrollButton";
import XcTaskCard from "@/components/xc/XcTaskCard";
import {
	useGetProgressByCategory,
	useGetTasksByCategory,
} from "@/hooks/use-query-api";

const categoryConfig: Record<
	string,
	{ level: string; name: string; icon: string; color: string }
> = {
	basic: {
		level: "basic",
		name: "Brevetto Basico",
		icon: "🥉",
		color: "bg-bronze-50 border-bronze-200",
	},
	intermediate: {
		level: "intermediate",
		name: "Brevetto Intermedio",
		icon: "🥈",
		color: "bg-slate-50 border-slate-200",
	},
	advanced: {
		level: "advanced",
		name: "Brevetto Avanzato",
		icon: "🥇",
		color: "bg-yellow-50 border-yellow-200",
	},
};

export default function CategoryPage() {
	const params = useParams();
	const t = useTranslations("XcCategoryPage");
	const category = categoryConfig[String(params.category).toLowerCase()];
	const {
		isLoading: isLoadingTasks,
		data: tasks,
		error: tasksError,
	} = useGetTasksByCategory(category?.level);
	const {
		isLoading: isLoadingProgress,
		data: xcProgress,
		error: progressError,
	} = useGetProgressByCategory(category?.level);

	const isEnrolled = xcProgress ?? false;

	if (!category) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="text-center pt-6">
						<p className="text-red-600 font-semibold mb-4">
							{t("errors.categoryNotFound")}
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

	if (isLoadingTasks) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (tasksError) {
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
					<Link href="/xc">
						<Button variant="outline" className="mb-4">
							<ArrowLeft className="mr-2 size-4" />
							{t("buttons.back")}
						</Button>
					</Link>

					<div className={`rounded-lg border-2 p-6 ${category.color}`}>
						<h1 className="text-4xl font-bold mb-2">
							{category.icon} {t(`categories.${category.level}.title`)}
						</h1>
						<p className="text-gray-600 text-lg">{t("header.description")}</p>
					</div>
				</div>

				{/* Progress Card */}
				{isEnrolled && xcProgress && (
					<Card className="mb-8 bg-blue-50 border-blue-200">
						<CardHeader>
							<CardTitle>{t("progress.title")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<p className="text-sm text-gray-600">
									{t("progress.currentPoints")}
									<span className="font-bold text-lg">{xcProgress.points}</span>
								</p>
								<p className="text-sm text-gray-600">
									{t("progress.minPoints")}
									<span className="font-bold text-lg">
										{xcProgress.minPoints}
									</span>
								</p>
								<div className="w-full bg-gray-200 rounded-full h-3 mt-4">
									<div
										className="bg-green-500 h-3 rounded-full transition-all"
										style={{
											width: `${Math.min(
												(xcProgress.points / xcProgress.minPoints) * 100,
												100,
											)}%`,
										}}
									></div>
								</div>
								{Boolean(xcProgress.completedAt) && (
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
					{tasks?.length === 0 ? (
						<Card>
							<CardContent className="text-center pt-6 text-gray-500">
								{t("tasks.empty")}
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{tasks?.map((task) => (
								<XcTaskCard key={task.id} task={task} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
