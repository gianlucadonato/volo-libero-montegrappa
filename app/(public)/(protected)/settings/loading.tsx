import { DashboardHeader } from "@/components/dashboard/header";
import LoadingSkeleton from "@/components/LoadingSkeleton";

export default function DashboardSettingsLoading() {
	return (
		<div className="container mt-10">
			<DashboardHeader
				heading="Settings"
				text="Manage account and website settings."
			/>
			<div className="divide-y divide-muted pb-10">
				<LoadingSkeleton section />
				<LoadingSkeleton section />
				<LoadingSkeleton section card />
			</div>
		</div>
	);
}
