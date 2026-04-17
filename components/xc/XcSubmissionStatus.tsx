"use client";

import { CheckCircle, Clock, RefreshCw, Trophy, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { XcSubmissionApi } from "@/types/api-schema";

interface XcSubmissionStatusProps {
	submission: XcSubmissionApi;
	onReupload?: () => void;
}

export default function XcSubmissionStatus({
	submission,
	onReupload,
}: XcSubmissionStatusProps) {
	const t = useTranslations("XcSubmissionStatus");

	if (submission.status === "PENDING") {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
				<Clock className="size-5 shrink-0 text-amber-600" />
				<div className="flex-1">
					<p className="text-sm font-medium text-amber-800">
						{t("pending.title")}
					</p>
					<p className="text-xs text-amber-600">{t("pending.description")}</p>
				</div>
				<Badge className="bg-amber-100 text-amber-800">
					{t("pending.badge")}
				</Badge>
			</div>
		);
	}

	if (submission.status === "APPROVED") {
		return (
			<div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
				<div className="flex items-center gap-2">
					<CheckCircle className="size-5 shrink-0 text-green-600" />
					<div className="flex-1">
						<p className="text-sm font-medium text-green-800">
							{t("approved.title")}
						</p>
					</div>
					<Badge className="bg-green-100 text-green-800">
						{t("approved.badge")}
					</Badge>
				</div>
				{submission.pointsAwarded > 0 && (
					<div className="flex items-center gap-1.5 pl-7 text-sm text-green-700">
						<Trophy className="size-4" />
						<span>
							{t("approved.pointsAwarded", {
								points: submission.pointsAwarded,
							})}
						</span>
					</div>
				)}
				{submission.notes && (
					<p className="pl-7 text-xs text-green-600">{submission.notes}</p>
				)}
			</div>
		);
	}

	// REJECTED
	return (
		<div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
			<div className="flex items-center gap-2">
				<XCircle className="size-5 shrink-0 text-red-600" />
				<div className="flex-1">
					<p className="text-sm font-medium text-red-800">
						{t("rejected.title")}
					</p>
					<p className="text-xs text-red-600">{t("rejected.description")}</p>
				</div>
				{/* <Badge variant="destructive">{t("rejected.badge")}</Badge> */}
				{onReupload && (
					<div className="flex justify-start">
						<Button
							variant="outline"
							size="sm"
							onClick={onReupload}
							className="gap-1.5 border-red-300 text-red-700 hover:bg-red-100"
						>
							<RefreshCw className="size-3.5" />
							{t("rejected.reupload")}
						</Button>
					</div>
				)}
			</div>
			{submission.notes && (
				<p className="pl-7 text-xs text-red-600">{submission.notes}</p>
			)}
		</div>
	);
}
