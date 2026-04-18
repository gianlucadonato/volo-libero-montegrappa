"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import XcSubmissionStatus from "@/components/xc/XcSubmissionStatus";
import type { XcSubmissionApi, XcTaskApi } from "@/types/api-schema";

export default function XcTaskCard({
	task,
	submission,
}: {
	task: XcTaskApi;
	submission?: XcSubmissionApi;
}) {
	const router = useRouter();
	const t = useTranslations("XcTaskCard");
	const handleUploadClick = () => null;
	return (
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

							{submission && (
								<div
									className="mt-3"
									onClick={(e) => e.stopPropagation()}
									onKeyDown={(e) => e.stopPropagation()}
								>
									<XcSubmissionStatus
										submission={submission}
										onReupload={handleUploadClick}
									/>
								</div>
							)}
						</CardContent>
					</div>
				</div>
			</Card>
		</div>
	);
}
