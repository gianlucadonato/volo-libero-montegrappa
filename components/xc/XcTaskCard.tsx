"use client";

import { Download, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useContext, useState } from "react";
import { ModalContext } from "@/components/modals/providers";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import type { XcTaskApi } from "@/types/api-schema";

export default function XcTaskCard({
	task,
	isEnrolled = false,
}: {
	task: XcTaskApi;
	isEnrolled?: boolean;
}) {
	const router = useRouter();
	const t = useTranslations("XcTaskCard");
	const { data: session } = authClient.useSession();
	const { setShowSignInModal } = useContext(ModalContext);
	const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

	const handleUploadClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!session) {
			setShowSignInModal(true);
			return;
		}

		if (!isEnrolled) {
			setIsEnrollmentModalOpen(true);
		} else {
			// TODO: Implement upload modal
			alert(t("uploadComingSoon"));
		}
	};

	const handleEnrollNowClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!session) {
			setShowSignInModal(true);
			return;
		}

		setIsEnrollmentModalOpen(false);
		router.push("/xc");
	};

	return (
		<>
			<div className="mb-6">
				<Card
					className="p-0 cursor-pointer"
					onClick={() => {
						router.push(`/xc/tasks/${task.id}`);
					}}
				>
					<div className="flex flex-col sm:flex-row">
						<div className="flex w-full justify-start sm:w-1/3">
							{task.imageUrl && (
								<Image
									src={task.imageUrl}
									alt={task.name}
									width={200}
									height={200}
									className="h-48 w-full object-cover"
								/>
							)}
						</div>
						<div className="flex-1 py-4">
							<CardHeader>
								<CardTitle>{task.name}</CardTitle>
								<CardDescription>{task.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<div>
									<p>
										{t("distance")}: {task.distanceKm} km
									</p>
									<p>
										{t("points")}: {task.points}
									</p>
								</div>
								<div className="mt-2 flex flex-col gap-2 sm:flex-row">
									<Link
										href={task.taskFileUrl || "#"}
										target="_blank"
										download
										className="w-full sm:w-auto"
										onClick={(e) => {
											e.stopPropagation();
											console.log("Download clicked", task.taskFileUrl);
										}}
									>
										<Button variant="outline" className="w-full">
											<span>{t("downloadTask")}</span>
											<Download className="ml-2 size-4" />
										</Button>
									</Link>
									<Button onClick={handleUploadClick}>
										<span>{t("uploadTrack")}</span>
										<Upload className="ml-2 size-4" />
									</Button>
								</div>
							</CardContent>
						</div>
					</div>
				</Card>
			</div>

			{/* Modal: not enrolled → invite to enroll */}
			<Dialog
				open={isEnrollmentModalOpen}
				onOpenChange={setIsEnrollmentModalOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("modal.title")}</DialogTitle>
						<DialogDescription>
							{t("modal.description", { year: new Date().getFullYear() })}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm text-blue-800">{t("modal.info")}</p>
						</div>

						<div className="flex gap-2 justify-end">
							<Button
								variant="outline"
								onClick={() => setIsEnrollmentModalOpen(false)}
							>
								{t("modal.cancel")}
							</Button>
							<Button
								onClick={handleEnrollNowClick}
								className="bg-lime-500 hover:bg-lime-600"
							>
								{t("modal.enrollNow")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
