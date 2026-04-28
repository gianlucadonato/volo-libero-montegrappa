"use client";

import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";
import {
	notFound,
	useParams,
	useRouter,
	useSearchParams,
} from "next/navigation";
import { useTranslations } from "next-intl";
import { DiceBearAvatar } from "@/components/DiceBearAvatar";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useGetXcEditions, useGetXcLeaderboard } from "@/hooks/use-query-api";
import { cn } from "@/lib/utils";
import type { XcLeaderboardEntryApi } from "@/types/api-schema";

const categories = [
	{ level: "basic", icon: "🥉" },
	{ level: "intermediate", icon: "🥈" },
	{ level: "advanced", icon: "🥇" },
] as const;

const validLevels = new Set(categories.map((c) => c.level));

export default function CategoryLeaderboardPage() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const t = useTranslations("XcLeaderboardPage");
	const tCat = useTranslations("XcCategoryPage");
	const currentLevel = String(params.category).toLowerCase();

	if (!validLevels.has(currentLevel as (typeof categories)[number]["level"])) {
		notFound();
	}

	const { data: editions } = useGetXcEditions();
	const editionParam = searchParams.get("edition");
	const selectedEdition = editionParam
		? Number(editionParam)
		: (editions?.find((e) => e.isActive)?.id ?? editions?.[0]?.id);

	const {
		isLoading,
		data: entries,
		error,
	} = useGetXcLeaderboard(currentLevel, selectedEdition);

	const top3 = entries?.slice(0, 3) ?? [];
	const rest = entries?.slice(3) ?? [];

	const buildHref = (level: string) => {
		const qs = editionParam ? `?edition=${editionParam}` : "";
		return `/xc/${level}/leaderboard${qs}`;
	};

	const handleEditionChange = (value: string) => {
		const newParams = new URLSearchParams(searchParams.toString());
		newParams.set("edition", value);
		router.push(`/xc/${currentLevel}/leaderboard?${newParams.toString()}`);
	};

	return (
		<div className="min-h-screen bg-linear-to-b from-indigo-50 to-white">
			<div className="max-w-3xl mx-auto px-4 py-8">
				{/* Back + Category Tabs */}
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Link href={`/xc/${currentLevel}`}>
						<Button variant="outline">
							<ArrowLeft className="mr-2 size-4" />
							{tCat("buttons.back")}
						</Button>
					</Link>

					<div className="flex flex-wrap items-center gap-3">
						<div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
							{categories.map((cat) => (
								<button
									key={cat.level}
									type="button"
									onClick={() => router.push(buildHref(cat.level))}
									className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
										currentLevel === cat.level
											? "bg-primary text-primary-foreground shadow-sm"
											: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
									}`}
								>
									<span>{cat.icon}</span>
									<span className="hidden sm:inline">
										{tCat(`categories.${cat.level}.title`)}
									</span>
									<span className="sm:hidden">
										{tCat(`categories.${cat.level}.short`)}
									</span>
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-center my-2">
					{editions && editions.length > 1 && (
						<Select
							value={selectedEdition ? String(selectedEdition) : undefined}
							onValueChange={handleEditionChange}
						>
							<SelectTrigger className="h-10 bg-white">
								<SelectValue placeholder={t("selectEdition")} />
							</SelectTrigger>
							<SelectContent>
								{editions.map((ed) => (
									<SelectItem key={ed.id} value={String(ed.id)}>
										{ed.title}
										{ed.isActive ? " ★" : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>

				{isLoading && (
					<div className="flex items-center justify-center py-16">
						<Spinner />
					</div>
				)}

				{error && (
					<Card>
						<CardContent className="text-center pt-6">
							<p className="text-red-600 font-semibold">
								{t("errors.failedToLoad")}
							</p>
						</CardContent>
					</Card>
				)}

				{!isLoading && !error && (
					<div className="overflow-hidden rounded-2xl bg-linear-to-b from-indigo-600 to-indigo-800 shadow-xl">
						{/* Header */}
						<div className="relative px-6 pt-8 pb-12 text-center">
							<div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 backdrop-blur-sm">
								<Trophy className="size-5 text-amber-300" />
								<h1 className="text-lg font-bold uppercase tracking-wider text-white">
									{t("title")}
								</h1>
							</div>
							<p className="mt-3 text-sm text-indigo-100">
								{tCat(`categories.${currentLevel}.title`)}
								{selectedEdition ? ` — ${selectedEdition}` : ""}
							</p>

							{/* Podium */}
							{top3.length > 0 ? (
								<div className="mt-8 flex items-end justify-center gap-3 sm:gap-6">
									{/* #2 */}
									<PodiumSlot
										entry={top3[1]}
										rank={2}
										sizeClass="size-16 sm:size-20"
										labelColor="text-indigo-100"
									/>
									{/* #1 */}
									<PodiumSlot
										entry={top3[0]}
										rank={1}
										sizeClass="size-20 sm:size-28"
										labelColor="text-amber-300"
										highlight
									/>
									{/* #3 */}
									<PodiumSlot
										entry={top3[2]}
										rank={3}
										sizeClass="size-16 sm:size-20"
										labelColor="text-indigo-100"
									/>
								</div>
							) : (
								<p className="mt-8 text-sm text-indigo-100">{t("empty")}</p>
							)}
						</div>

						{/* Curved separator */}
						<div className="relative -mt-6 h-6 bg-white rounded-t-[2rem]" />

						{/* List */}
						<div className="bg-white px-3 pb-6 pt-2 sm:px-6">
							{rest.length === 0 && top3.length > 0 && (
								<p className="py-4 text-center text-sm text-gray-500">
									{t("noMore")}
								</p>
							)}
							<ul className="space-y-2">
								{rest.map((entry) => (
									<li
										key={entry.userId}
										className="flex items-center gap-3 rounded-full bg-indigo-50 px-3 py-2 sm:px-4 sm:py-3"
									>
										<span className="w-10 shrink-0 text-sm font-bold text-indigo-700 sm:text-base">
											#{entry.rank}
										</span>
										<DiceBearAvatar
											seed={`${entry.firstName} ${entry.lastName}`}
											alt={`${entry.firstName} ${entry.lastName}`}
											className="size-9 shrink-0 sm:size-10"
										/>
										<span className="flex-1 truncate text-sm font-semibold uppercase tracking-wide text-indigo-900 sm:text-base">
											{entry.firstName} {entry.lastName}
										</span>
										<span className="shrink-0 text-sm font-bold text-indigo-700 sm:text-base">
											{entry.points.toLocaleString()}
										</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function PodiumSlot({
	entry,
	rank,
	sizeClass,
	labelColor,
	highlight = false,
}: {
	entry: XcLeaderboardEntryApi | undefined;
	rank: number;
	sizeClass: string;
	labelColor: string;
	highlight?: boolean;
}) {
	return (
		<div className="flex flex-col items-center">
			<span className={cn("mb-2 text-sm font-bold", labelColor)}>#{rank}</span>
			<div
				className={cn(
					"relative flex items-center justify-center rounded-full bg-white/10 ring-2 backdrop-blur-sm",
					highlight ? "ring-amber-300" : "ring-white/30",
				)}
			>
				{entry ? (
					<DiceBearAvatar
						seed={`${entry.firstName} ${entry.lastName}`}
						alt={`${entry.firstName} ${entry.lastName}`}
						className={sizeClass}
					/>
				) : (
					<div className={cn("rounded-full bg-white/10", sizeClass)} />
				)}
				{highlight && (
					<Trophy className="absolute -bottom-2 size-6 text-amber-300 drop-shadow" />
				)}
			</div>
			<p className="mt-2 max-w-24 truncate text-xs font-bold uppercase text-white sm:max-w-32 sm:text-sm">
				{entry?.firstName ?? "—"}
			</p>
			<p className={cn("text-xs font-bold sm:text-sm", labelColor)}>
				{entry ? entry.points.toLocaleString() : "—"}
			</p>
		</div>
	);
}
