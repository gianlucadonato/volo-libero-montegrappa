"use client";

import { Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { ModalContext } from "@/components/modals/providers";
import { Button } from "@/components/ui/button";
import XcSubmissionStatus from "@/components/xc/XcSubmissionStatus";
import { useGetXcEnrollment, useGetXcSubmission } from "@/hooks/use-query-api";
import { uploadXcTaskTrackApi, validateSubmissionApi } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

interface XcTaskActionButtonsProps {
	taskId: string;
	taskFileUrl?: string | null;
	onUploadSuccess?: () => void;
}

export default function XcTaskActionButtons({
	taskId,
	taskFileUrl,
	onUploadSuccess,
}: XcTaskActionButtonsProps) {
	const [isDownloading, setIsDownloading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const t = useTranslations("XcTaskCard");
	const { isPending, data: session } = authClient.useSession();
	const isLoggedIn = Boolean(session?.user);
	const { data: enrollment } = useGetXcEnrollment(isLoggedIn);
	const isEnrolled = Boolean(enrollment);
	const { isLoading: isSubmissionLoading, data: submission } =
		useGetXcSubmission(taskId, isLoggedIn && isEnrolled);
	const { setShowSignInModal, setShowEnrollXcEditionModal } =
		useContext(ModalContext);

	const handleDownload = async () => {
		if (!taskId || !taskFileUrl) return;
		try {
			setIsDownloading(true);
			const response = await fetch(`/api/xc/tasks/${taskId}/download`);
			if (!response.ok) throw new Error("Download failed");
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = taskFileUrl.split("/").pop() || "task.tsk";
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

	const handleUploadClick = () => {
		if (!session) {
			setShowSignInModal(true);
			return;
		}
		if (!enrollment) {
			setShowEnrollXcEditionModal(true);
			return;
		}
		fileInputRef.current?.click();
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !taskId) return;
		setIsUploading(true);
		try {
			const response = await uploadXcTaskTrackApi(taskId, file);
			if (response.error) {
				console.error("Upload error:", response.error);
				toast.error(t("toast.uploadError"));
				return;
			}

			toast.success(t("toast.uploadSuccess"));
			onUploadSuccess?.();

			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}

			// Fire validation in the background — don't block the UI
			const submissionId = response.data?.submissionId;
			if (submissionId) {
				validateSubmissionApi(submissionId)
					.then((validation) => {
						if (validation.valid) {
							toast.success(t("toast.validationSuccess"));
						} else {
							toast.error(t("toast.validationFailed"));
						}
						onUploadSuccess?.();
					})
					.catch(() => {
						onUploadSuccess?.();
					});
			}
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="flex flex-col">
			{!isSubmissionLoading && submission ? (
				<XcSubmissionStatus
					submission={submission}
					onReupload={handleUploadClick}
					isUploading={isUploading}
				/>
			) : (
				<div className="mt-4 mb-8 flex flex-col items-start gap-4 rounded-xl bg-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<h3 className="font-heading text-xl font-bold text-slate-900">
							{t("cta.title")}
						</h3>
						<p className="text-sm text-slate-600">{t("cta.description")}</p>
					</div>
					<div className="flex shrink-0 flex-col gap-2 sm:flex-row">
						{taskFileUrl && (
							<Button
								variant="outline"
								onClick={handleDownload}
								disabled={isDownloading}
								className="gap-2 bg-white"
							>
								<Download className="size-4" />
								{isDownloading ? "Downloading..." : t("downloadTask")}
							</Button>
						)}
						<Button
							onClick={handleUploadClick}
							disabled={isUploading || isPending}
							className="gap-2 rounded-lg bg-slate-700 font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800"
						>
							<Upload className="size-4" />
							{isUploading ? t("uploading") : t("uploadTrack")}
						</Button>
					</div>
				</div>
			)}
			<input
				ref={fileInputRef}
				type="file"
				accept=".igc"
				onChange={handleFileSelect}
				className="hidden"
			/>
		</div>
	);
}
