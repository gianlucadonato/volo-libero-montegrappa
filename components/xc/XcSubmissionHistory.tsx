"use client";

import { CheckCircle, Clock, History, MapPin, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { components } from "@/types/api-client";

type XcSubmission = components["schemas"]["XcSubmissionSchema"];

interface XcSubmissionHistoryProps {
	submissions: XcSubmission[];
	selectedSubmissionId: string | null;
	onSelect: (submissionId: string) => void;
}

const STATUS_ICON: Record<XcSubmission["status"], React.ReactNode> = {
	APPROVED: <CheckCircle className="size-4 text-green-600" />,
	PENDING: <Clock className="size-4 text-amber-500" />,
	REJECTED: <XCircle className="size-4 text-red-500" />,
};

export default function XcSubmissionHistory({
	submissions,
	selectedSubmissionId,
	onSelect,
}: XcSubmissionHistoryProps) {
	const t = useTranslations("XcSubmissionHistory");

	if (submissions.length === 0) return null;

	return (
		<section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<header className="mb-4 flex items-center gap-2">
				<History className="size-5 text-slate-600" />
				<h3 className="font-heading text-lg font-bold text-slate-900">
					{t("title")}
				</h3>
			</header>
			<p className="mb-4 text-sm text-slate-600">{t("description")}</p>
			<ul className="flex flex-col gap-2">
				{submissions.map((submission) => {
					const stats = (
						submission.flightData as
							| { stats?: { totalDistanceKm?: number; duration?: string } }
							| null
							| undefined
					)?.stats;
					const isSelected = submission.id === selectedSubmissionId;
					return (
						<li key={submission.id}>
							<button
								type="button"
								onClick={() => onSelect(submission.id)}
								className={cn(
									"flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
									isSelected
										? "border-blue-500 bg-blue-50"
										: "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
								)}
							>
								<div className="flex items-center gap-3">
									{STATUS_ICON[submission.status]}
									<div>
										<div className="font-medium text-slate-900">
											{t("edition", { year: submission.editionId })}
										</div>
										{stats && (
											<div className="flex items-center gap-3 text-xs text-slate-500">
												{stats.totalDistanceKm != null && (
													<span className="flex items-center gap-1">
														<MapPin className="size-3" />
														{stats.totalDistanceKm.toFixed(1)} km
													</span>
												)}
												{stats.duration && <span>{stats.duration}</span>}
											</div>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									{submission.pointsAwarded > 0 && (
										<Badge variant="secondary">
											{submission.pointsAwarded} {t("points")}
										</Badge>
									)}
									<span
										className={cn(
											"text-sm font-medium",
											isSelected ? "text-blue-600" : "text-slate-500",
										)}
									>
										{isSelected ? t("viewing") : t("view")}
									</span>
								</div>
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
