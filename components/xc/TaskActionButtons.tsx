"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface TaskActionButtonsProps {
	taskId: string;
	taskFileUrl: string | null;
	downloadLabel: string;
	uploadLabel: string;
	uploadingLabel: string;
}

export default function TaskActionButtons({
	taskId,
	taskFileUrl,
	downloadLabel,
	uploadLabel,
	uploadingLabel,
}: TaskActionButtonsProps) {
	const [isDownloading, setIsDownloading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDownload = async () => {
		if (!taskId || !taskFileUrl) return;

		try {
			setIsDownloading(true);
			const response = await fetch(`/api/xc/tasks/${taskId}/download`);

			if (!response.ok) {
				throw new Error("Download failed");
			}

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
		fileInputRef.current?.click();
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !taskId) return;

		try {
			setIsUploading(true);
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(`/api/xc/tasks/${taskId}/upload`, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				throw new Error("Upload failed");
			}

			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} catch (error) {
			console.error("Upload error:", error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-2">
			{taskFileUrl && (
				<Button
					onClick={handleDownload}
					disabled={isDownloading}
					className="gap-2 flex-1 sm:flex-none"
				>
					<Download className="size-4" />
					{isDownloading ? "..." : downloadLabel}
				</Button>
			)}
			{taskId && (
				<>
					<Button
						onClick={handleUploadClick}
						disabled={isUploading}
						className="gap-2 flex-1 sm:flex-none rounded-lg bg-linear-to-r from-amber-500 to-amber-600 py-4 font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-amber-600 hover:to-amber-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:hover:scale-100"
					>
						<Upload className="size-4" />
						{isUploading ? uploadingLabel : uploadLabel}
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".tsk"
						onChange={handleFileSelect}
						className="hidden"
					/>
				</>
			)}
		</div>
	);
}
