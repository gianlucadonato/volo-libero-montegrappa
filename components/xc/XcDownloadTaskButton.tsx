"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface XcDownloadTaskButtonProps {
	taskId: string;
	taskFileUrl: string;
	label: string;
}

export default function XcDownloadTaskButton({
	taskId,
	taskFileUrl,
	label,
}: XcDownloadTaskButtonProps) {
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = async () => {
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

	return (
		<Button
			onClick={handleDownload}
			disabled={isDownloading}
			variant="outline"
			className="gap-2"
		>
			<Download className="size-4" />
			{isDownloading ? "..." : label}
		</Button>
	);
}
