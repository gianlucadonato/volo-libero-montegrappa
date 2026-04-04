import { ArrowLeft, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import getTaskById from "@/actions/xc/getTaskById";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Task - ${siteConfig.name}`,
	description: "Task details page",
});

export default async function TaskPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const task = await getTaskById(id);
	const t = await getTranslations("TaskPage");
	if (!task || !task.name) {
		return <div>{t("not_found")}</div>;
	}

	return (
		<section className="px-4 py-20">
			<div className="container mx-auto">
				<div>
					<div className="mb-4 flex justify-start">
						<Link href={`/xc/${task.category.toLowerCase()}`}>
							<Button variant="outline" size="sm">
								<ArrowLeft className="mr-2 size-4" />
								{t("back")}
							</Button>
						</Link>
					</div>
					<div className="mb-6">
						<DashboardHeader
							heading={
								<div className="flex items-center">
									<MapPinIcon className="mr-2 size-5" />
									<span>{task.name}</span>
								</div>
							}
							text={task.description || ""}
						/>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>{task.name}</CardTitle>
							<CardDescription>{task.description || ""}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2">{task.category}</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
