"use client";

import { Download, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TaskBrevetto } from "@/app/(public)/xc-montegrappa/TaskBrevetto";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function TaskBrevettoCard({ task }: { task: TaskBrevetto }) {
	const router = useRouter();
	return (
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
								<Button
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<span>Carica Traccia</span>
									<Upload className="ml-2 size-4" />
								</Button>
							</div>
						</CardContent>
					</div>
				</div>
			</Card>
		</div>
	);
}
