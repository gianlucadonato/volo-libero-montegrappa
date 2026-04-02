"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import getMyXcProgress from "@/actions/xc/getMyXcProgress";
import { getXcTasksByCategory } from "@/actions/xc/getXcTasks";
import { ModalContext } from "@/components/modals/providers";
import Spinner from "@/components/Spinner";
import TaskBrevettoCard from "@/components/TaskBrevettoCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

type XcProgress = Awaited<ReturnType<typeof getMyXcProgress>>;

interface XcTaskData {
	id: string;
	name: string;
	description?: string | null;
	points: number;
	distanceKm?: number | null;
	taskFileUrl?: string | null;
	imageUrl?: string | null;
	isPublished: boolean;
}

const categoryConfig: Record<
	string,
	{ level: XcCategoryLevel; name: string; icon: string; color: string }
> = {
	basic: {
		level: "BASIC",
		name: "Brevetto Basico",
		icon: "🥉",
		color: "bg-amber-50 border-amber-200",
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
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const { setShowSignInModal } = useContext(ModalContext);
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
					setError("Category not found");
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
				setError("Failed to load tasks. Please try again.");
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [config]);

	if (!config) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardContent className="text-center pt-6">
						<p className="text-red-600 font-semibold mb-4">
							Category not found
						</p>
						<Link href="/xc-montegrappa">
							<Button variant="outline" className="w-full">
								<ArrowLeft className="mr-2 size-4" />
								Back to XC Montegrappa
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
								Back to XC Montegrappa
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

	const handleEnrollNowClick = () => {
		if (!session) {
			setShowSignInModal(true);
			return;
		}
		router.push("/xc-montegrappa");
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<div className="max-w-5xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="mb-8">
					<Link href="/xc-montegrappa">
						<Button variant="outline" className="mb-4">
							<ArrowLeft className="mr-2 size-4" />
							Back
						</Button>
					</Link>

					<div className={`rounded-lg border-2 p-6 ${config.color}`}>
						<h1 className="text-4xl font-bold mb-2">
							{config.icon} {config.name}
						</h1>
						<p className="text-gray-600 text-lg">
							Complete the tasks and accumulate points to earn the certificate
						</p>
					</div>
				</div>

				{/* Progress Card */}
				{isEnrolled && categoryProgress && (
					<Card className="mb-8 bg-blue-50 border-blue-200">
						<CardHeader>
							<CardTitle>Your Progress</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<p className="text-sm text-gray-600">
									Current Points:{" "}
									<span className="font-bold text-lg">
										{categoryProgress.points}
									</span>
								</p>
								<p className="text-sm text-gray-600">
									Minimum Points Required:{" "}
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
										✅ You have completed this category!
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{!isEnrolled && (
					<Card className="mb-8 bg-amber-50 border-amber-200">
						<CardContent className="text-center pt-6">
							<p className="text-amber-800 mb-4">
								Iscriviti al Brevetto XC per poter caricare le tracce.
							</p>
							<Button onClick={handleEnrollNowClick}>Iscriviti ora</Button>
						</CardContent>
					</Card>
				)}

				{/* Tasks List */}
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-6">Available Tasks</h2>
					{tasks.length === 0 ? (
						<Card>
							<CardContent className="text-center pt-6 text-gray-500">
								No tasks available for this category yet.
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{tasks.map((task: XcTaskData) => (
								<TaskBrevettoCard
									key={task.id}
									task={{
										id: parseInt(task.id.split("-")[0], 10) || 0,
										name: task.name,
										description: task.description || "",
										distance: task.distanceKm || 0,
										image: task.imageUrl || "/xcmontegrappa/basic/01/b01.png",
										gpx: task.taskFileUrl || "",
										type: categoryParam as
											| "basic"
											| "intermediate"
											| "advanced",
										points: task.points,
									}}
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
