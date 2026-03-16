import getReports from "@/actions/getReports";
import { DashboardHeader } from "@/components/dashboard/header";
import Reports from "@/components/Reports";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `ElMeteo Status - ${siteConfig.name}`,
	description: "ElMeteo Reports",
});

export default async function ReportsPage() {
	const reports = await getReports();
	return (
		<div className="font-mono">
			<DashboardHeader heading="ElMeteo Status" text="Upload Reports" />
			<div className="mb-12">
				<div className="pt-8">
					<Reports reports={reports} />
				</div>
			</div>
		</div>
	);
}
