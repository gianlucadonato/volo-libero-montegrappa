import { UserCheck, UserX } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import getPayments from "@/actions/getPayments";
import getPaymentsByDay from "@/actions/getPaymentsByDay";
import getUsers from "@/actions/getUsers";
import { PaymentMethodsPieChart } from "@/components/charts/payment-methods-pie-chart";
import { PaymentsByDay } from "@/components/charts/payments-by-day";
import GenderCard from "@/components/dashboard/gender-card";
import { DashboardHeader } from "@/components/dashboard/header";
import InfoCard from "@/components/dashboard/info-card";
import { constructMetadata, siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
	title: `Admin - ${siteConfig.name}`,
	description: "Admin page for only admin management.",
});

export default async function AdminPage() {
	const t = await getTranslations("AdminPage");
	const user = await getSessionUser();
	if (!user || user.role !== "ADMIN") redirect("/login");

	const allUsers = await getUsers();
	const members = allUsers.filter((user) => user.role === "MEMBER");
	const users = allUsers.filter((user) => user.role === "USER");

	const male = allUsers.filter((user) => user.gender === "M");
	const female = allUsers.filter((user) => user.gender === "F");

	const payments = await getPayments({ from: "2025-12-30 00:00:00" });
	const groupedPayments = await getPaymentsByDay();
	const paymentsByType = payments.reduce<Record<string, number>>(
		(acc, payment) => {
			const paymentMethod = payment.paymentMethod ?? "unknown";

			if (!acc[paymentMethod]) {
				acc[paymentMethod] = 1;
			} else {
				acc[paymentMethod] += 1;
			}
			return acc;
		},
		{},
	);

	return (
		<div className="container mt-10">
			<DashboardHeader
				heading={t("header_title")}
				text={t("header_description")}
			/>
			<div className="mt-6 flex flex-col gap-5">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<InfoCard title={t("users")} value={allUsers.length} />
					<InfoCard
						title={t("members")}
						value={members.length}
						icon={UserCheck}
					/>
					<InfoCard
						title={t("not_members")}
						value={users.length}
						icon={UserX}
					/>
					<GenderCard maleCount={male.length} femaleCount={female.length} />
				</div>
				<div className="flex flex-col gap-5">
					<div className="grid grid-cols-1 gap-4">
						<div className="col-span-1">
							<PaymentsByDay payments={groupedPayments} />
						</div>
						<div className="col-span-1">
							<PaymentMethodsPieChart payments={paymentsByType} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
