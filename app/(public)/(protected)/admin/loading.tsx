import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AdminPanelLoading() {
	const t = await getTranslations(""AdminPage");
  return (
    <div className="container mt-10">
      <DashboardHeader
        heading={t("header_title")}
        text={t("header_description"
			/>
			<div className="flex flex-col gap-5">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Skeleton className="h-32 w-full rounded-lg" />
					<Skeleton className="h-32 w-full rounded-lg" />
					<Skeleton className="h-32 w-full rounded-lg" />
					<Skeleton className="h-32 w-full rounded-lg" />
				</div>
				<Skeleton className="h-125 w-full rounded-lg" />
				<Skeleton className="h-125 w-full rounded-lg" />
			</div>
		</div>
	);
}
