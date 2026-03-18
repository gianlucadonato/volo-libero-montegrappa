import { getTranslations } from "next-intl/server";
import getPayments from "@/actions/getPayments";
import PaymentsList from "@/components/admin/PaymentsList";
import { DashboardHeader } from "@/components/dashboard/header";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Payments - ${siteConfig.name}`,
	description: "List all payments.",
});

export default async function PaymentsPage() {
	const t = await getTranslations("PaymentsPage");
	const payments = await getPayments();
	return (
		<div className="container mt-10">
			<DashboardHeader
				heading={t("header_title")}
				text={t("header_description")}
			/>
			<div className="mt-4 flex flex-col gap-5">
				<PaymentsList data={payments} />
			</div>
		</div>
	);
}
