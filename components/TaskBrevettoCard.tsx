"use client";

import { Download, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import type { TaskBrevetto } from "@/app/(public)/xc-montegrappa/TaskBrevetto";
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

interface TaskBrevettoCardProps {
	task: TaskBrevetto;
	isEnrolled?: boolean;
}

export default function TaskBrevettoCard({
	task,
	isEnrolled = false,
}: TaskBrevettoCardProps) {
	const router = useRouter();
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
			alert("Upload feature coming soon!");
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
		router.push("/xc-montegrappa");
	};

	return (
		<>
			<div className="mb-6">
				<Card
					className="p-0 cursor-pointer"
					onClick={() => {
						router.push(`/xc-montegrappa/tasks/${task.id}`);
					}}
				>
					<div className="flex flex-col sm:flex-row">
						<div className="flex w-full justify-start sm:w-1/3">
							<Image
								src={task.image}
								alt={task.name}
								width={200}
								height={200}
								className="h-48 w-full object-cover"
							/>
						</div>
						<div className="flex-1 py-4">
							<CardHeader>
								<CardTitle>{task.name}</CardTitle>
								<CardDescription>{task.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<div>
									<p>Distanza: {task.distance} km</p>
									<p>Punti: {task.points}</p>
								</div>
								<div className="mt-2 flex flex-col gap-2 sm:flex-row">
									<Link
										href={task.gpx}
										target="_blank"
										download
										className="w-full sm:w-auto"
										onClick={(e) => e.stopPropagation()}
									>
										<Button variant="outline" className="w-full">
											<span>Scarica Task (.tsk)</span>
											<Download className="ml-2 size-4" />
										</Button>
									</Link>
									<Button onClick={handleUploadClick}>
										<span>Carica Traccia</span>
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
						<DialogTitle>Iscrizione richiesta</DialogTitle>
						<DialogDescription>
							Per caricare la tua traccia devi prima iscriverti al Brevetto XC
							Montegrappa {new Date().getFullYear()}.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<p className="text-sm text-blue-800">
								Iscrivendoti potrai caricare tracce GPX e IGC per tutte le
								categorie (Basico, Intermedio, Avanzato) durante tutto
								l&apos;anno.
							</p>
						</div>

						<div className="flex gap-2 justify-end">
							<Button
								variant="outline"
								onClick={() => setIsEnrollmentModalOpen(false)}
							>
								Annulla
							</Button>
							<Button
								onClick={handleEnrollNowClick}
								className="bg-lime-500 hover:bg-lime-600"
							>
								Iscriviti ora
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
