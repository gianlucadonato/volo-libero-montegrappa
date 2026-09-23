import { getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AdminPanelLoading() {
	const t = await getTranslations("AdminPage");
	return (
		<div className="container mt-10">
			<DashboardHeader
				heading={t("header_title")}
				text={t("header_description")}
			>
				{/* Shaped like the year selector: the header is real here, so leaving
				    this out makes the row jump once the page resolves. */}
				<Skeleton className="h-10 w-32 rounded-md" />
			</DashboardHeader>
			<div className="mt-6 flex flex-col gap-5">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
