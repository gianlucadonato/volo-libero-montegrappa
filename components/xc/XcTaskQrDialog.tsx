"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { downloadBlobFromUrl } from "@/lib/xc-task";

interface XcTaskQrDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	qrUrl: string | null;
	taskName: string;
	title: string;
	description: string;
	downloadLabel: string;
	unavailableLabel: string;
	alt: string;
}

export default function XcTaskQrDialog({
	open,
	onOpenChange,
	qrUrl,
	taskName,
	title,
	description,
	downloadLabel,
	unavailableLabel,
	alt,
}: XcTaskQrDialogProps) {
	const [imgError, setImgError] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	// Clear any prior load error when the dialog (re)opens so a retry re-fetches.
	const handleOpenChange = (next: boolean) => {
		if (next) setImgError(false);
		onOpenChange(next);
	};

	const showImage = Boolean(qrUrl) && !imgError;

	const handleDownload = async () => {
		if (!qrUrl) return;
		try {
			setIsDownloading(true);
			await downloadBlobFromUrl(qrUrl, `${taskName}-qr.jpg`);
		} catch (error) {
			console.error("QR download error:", error);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{showImage && qrUrl ? (
					<div className="flex flex-col items-center gap-4">
						{/* biome-ignore lint/performance/noImgElement: QR is a tiny static jpg served straight from the public assets bucket; next/image's optimizer adds no value here. */}
						<img
							src={qrUrl}
							alt={alt}
							width={256}
							height={256}
							className="size-64 rounded-md bg-white object-contain p-2 ring-1 ring-foreground/10"
							onError={() => setImgError(true)}
						/>
						{/* Not an <a download>: the bucket is a different origin, where
						    the download attribute is ignored. */}
						<Button
							variant="outline"
							onClick={handleDownload}
							disabled={isDownloading}
						>
							<Download className="mr-2 size-4" />
							{downloadLabel}
						</Button>
					</div>
				) : (
					<p className="py-6 text-center text-sm text-muted-foreground">
						{unavailableLabel}
					</p>
				)}
			</DialogContent>
		</Dialog>
	);
}
