"use client";

import { Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { ModalContext } from "@/components/modals/providers";
import { Button } from "@/components/ui/button";
import XcSubmissionStatus from "@/components/xc/XcSubmissionStatus";
import { useGetXcEnrollment } from "@/hooks/use-query-api";
import {
	deleteSubmissionApi,
	uploadXcTaskTrackApi,
	validateSubmissionApi,
} from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import type { components } from "@/types/api-client";

type XcSubmission = components["schemas"]["XcSubmissionSchema"];

interface XcTaskActionButtonsProps {
	taskId: string;
	taskFileUrl?: string | null;
	submission?: XcSubmission | null;
	onUploadSuccess?: () => void;
}

export default function XcTaskActionButtons({
	taskId,
	taskFileUrl,
	submission,
	onUploadSuccess,
}: XcTaskActionButtonsProps) {
	const [isDownloading, setIsDownloading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const t = useTranslations("XcTaskCard");
	const { isPending, data: session } = authClient.useSession();
	const isLoggedIn = Boolean(session?.user);
	const { data: enrollment } = useGetXcEnrollment(isLoggedIn);
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
			link.download = (taskFileUrl.split("/").pop() || "task.tsk").replace(
				/\.tsk$/,
				".xctsk",
			);
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

	const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !taskId) return;
		setIsUploading(true);
		try {
			const response = await uploadXcTaskTrackApi(taskId, file);
			if (response.error) {
				console.error("Upload error:", response.error);
				const serverMessage =
					typeof response.error === "object" &&
					response.error !== null &&
					"error" in response.error
						? (response.error as { error?: string }).error
						: undefined;
				toast.error(serverMessage || t("toast.uploadError"));
				return;
			}

			toast.success(t("toast.uploadSuccess"));
			onUploadSuccess?.();

			// Fire validation in the background — don't block the UI
			const submissionId = response.data?.submissionId;
			if (submissionId) {
				validateSubmissionApi(submissionId)
					.then(({ data: validation, error }) => {
						if (error || !validation) {
							toast.error(t("toast.validationFailed"));
						} else {
							toast.success(t("toast.validationSuccess"));
						}
						onUploadSuccess?.();
					})
					.catch(() => {
						onUploadSuccess?.();
					});
			}
		} finally {
			setIsUploading(false);
			// Always reset the file input so re-selecting the same file fires onChange again
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleDelete = async () => {
		if (!submission?.id) return;
		setIsDeleting(true);
		try {
			const { error } = await deleteSubmissionApi(submission.id);
			if (error) {
				toast.error(t("toast.deleteError"));
				return;
			}
			toast.success(t("toast.deleteSuccess"));
			onUploadSuccess?.();
		} catch (error) {
			console.error("Delete error:", error);
			toast.error(t("toast.deleteError"));
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			{submission ? (
				<XcSubmissionStatus
					submission={submission}
					onReupload={handleUploadClick}
					onDelete={handleDelete}
					isUploading={isUploading}
					isDeleting={isDeleting}
				/>
			) : (
				<div className="flex flex-col items-start gap-4 rounded-xl bg-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between">
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
