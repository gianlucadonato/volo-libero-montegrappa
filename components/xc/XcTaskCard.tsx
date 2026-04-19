"use client";

import { CheckCircle, Clock, Download, Eye, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { XcSubmissionApi, XcTaskApi } from "@/types/api-schema";

function StatusBadge({ submission }: { submission?: XcSubmissionApi }) {
	const t = useTranslations("XcTaskCard");
	if (!submission) return null;

	if (submission.status === "APPROVED") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
				<CheckCircle className="size-3" />
				{t("badge.completed")}
			</span>
		);
	}
	if (submission.status === "PENDING") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
				<Clock className="size-3" />
				{t("badge.pending")}
			</span>
		);
	}
	return null;
}

export default function XcTaskCard({
	task,
	submission,
}: {
	task: XcTaskApi;
	submission?: XcSubmissionApi;
}) {
	const t = useTranslations("XcTaskCard");
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!task.taskFileUrl) return;
		try {
			setIsDownloading(true);
			const response = await fetch(`/api/xc/tasks/${task.id}/download`);
			if (!response.ok) throw new Error("Download failed");
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = task.taskFileUrl.split("/").pop() || "task.tsk";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Download error:", error);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-green-400/50 hover:shadow-md">
			{/* Image + badge + gradient */}
			<div className="relative aspect-4/3 w-full overflow-hidden">
				{task.imageUrl ? (
					<Image
						src={task.imageUrl}
						alt={task.name}
						fill
						className="object-cover transition-transform group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full items-center justify-center bg-gray-100">
						<span className="text-gray-400 text-sm">{t("noImage")}</span>
					</div>
				)}
				{/* Gradient overlay */}
				<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-white to-transparent" />
				{/* Status badge */}
				<div className="absolute top-2.5 right-2.5">
					<StatusBadge submission={submission} />
				</div>
			</div>

			{/* Info */}
			<div className="flex flex-1 flex-col p-4">
				<h3 className="font-bold text-gray-900 text-lg leading-tight">
					{task.name}
				</h3>
				{task.description && (
					<p className="mt-1 text-sm text-gray-500 line-clamp-1">
						{task.description}
					</p>
				)}
				<p className="mt-2 text-sm text-gray-600">
					{t("distance")}: {task.distanceKm} km
				</p>
				<p className="mt-1 text-sm text-gray-600">
					{t("difficulty")}:{" "}
					{t(`difficultyLevel.${task.category.toLowerCase()}`)}
				</p>

				{/* XP Badge */}
				<div className="mt-3">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-600">
						<Star className="size-4" />+{task.points} XC
					</span>
				</div>
				<div className="mt-auto flex items-center gap-2 pt-4">
					{task.taskFileUrl && (
						<Button
							size="icon"
							variant="outline"
							className="shrink-0"
							onClick={handleDownload}
							disabled={isDownloading}
							title={t("downloadTask")}
						>
							<Download className="size-4" />
						</Button>
					)}
					<Button className="flex-1">
						<Link
							href={`/xc/tasks/${task.id}`}
							className="flex items-center justify-center gap-2"
						>
							<Eye className="size-4" />
							{t("viewTrack")}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
