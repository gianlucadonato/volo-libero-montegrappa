import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { Skeleton } from "@/components/ui/skeleton";

export default async function Loading() {
	const t = await getTranslations("MeteoPage");
	return (
		<div className="flex flex-col gap-5">
			<Skeleton className="h-[200px] w-full rounded-lg" />
			<DashboardHeader
				heading={t("header_title")}
				text={t("header_description")}
			/>
			<Skeleton className="h-[500px] w-full rounded-lg" />
		</div>
	);
}
