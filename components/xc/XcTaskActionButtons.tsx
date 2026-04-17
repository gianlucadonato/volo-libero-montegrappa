"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { ModalContext } from "@/components/modals/providers";
import { Button } from "@/components/ui/button";
import XcSubmissionStatus from "@/components/xc/XcSubmissionStatus";
import { useGetXcEnrollment, useGetXcSubmission } from "@/hooks/use-query-api";
import { uploadXcTaskTrackApi } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

interface XcTaskActionButtonsProps {
	taskId: string;
	uploadLabel: string;
	uploadingLabel: string;
}

export default function XcTaskActionButtons({
	taskId,
	uploadLabel,
	uploadingLabel,
}: XcTaskActionButtonsProps) {
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const t = useTranslations("XcTaskCard");
	const { isPending, data: session } = authClient.useSession();
	const isLoggedIn = Boolean(session?.user);
	const { data: enrollment } = useGetXcEnrollment(isLoggedIn);
	const isEnrolled = Boolean(enrollment);
	const { data: submission, refetch: refetchSubmission } = useGetXcSubmission(
		taskId,
		isLoggedIn && isEnrolled,
	);
	const { setShowSignInModal, setShowEnrollXcEditionModal } =
		useContext(ModalContext);

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
		const response = await uploadXcTaskTrackApi(taskId, file);
		if (response.error) {
			console.error("Upload error:", response.error);
			toast.error(t("toast.uploadError"));
		} else {
			toast.success(t("toast.uploadSuccess"));
			refetchSubmission();
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
		setIsUploading(false);
	};

	return (
		<div className="flex flex-col">
			{submission && (
				<XcSubmissionStatus
					submission={submission}
					onReupload={
						submission.status === "REJECTED" ? handleUploadClick : undefined
					}
				/>
			)}
			<div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-2">
				{taskId && !submission && (
					<>
						<Button
							onClick={handleUploadClick}
							disabled={isUploading || isPending}
							className="gap-2 flex-1 sm:flex-none rounded-lg bg-linear-to-r from-amber-500 to-amber-600 font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-amber-600 hover:to-amber-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:hover:scale-100"
						>
							<Upload className="size-4" />
							{isUploading ? uploadingLabel : uploadLabel}
						</Button>
						<input
							ref={fileInputRef}
							type="file"
							accept=".igc"
							onChange={handleFileSelect}
							className="hidden"
						/>
					</>
				)}
			</div>
		</div>
	);
}
