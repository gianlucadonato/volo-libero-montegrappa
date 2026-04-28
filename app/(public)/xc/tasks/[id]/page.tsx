import XcTaskDetailsPage from "@/components/xc/XcTaskDetailsPage";
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
	return <XcTaskDetailsPage taskId={id} />;
}
