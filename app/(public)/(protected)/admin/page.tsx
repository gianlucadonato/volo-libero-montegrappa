import { UserCheck, UserX } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import getAdminYearStats from "@/actions/getAdminYearStats";
import getAdminYears from "@/actions/getAdminYears";
import getPayments from "@/actions/getPayments";
import { PaymentMethodsPieChart } from "@/components/charts/payment-methods-pie-chart";
import { PaymentsByDay } from "@/components/charts/payments-by-day";
import GenderCard from "@/components/dashboard/gender-card";
import { DashboardHeader } from "@/components/dashboard/header";
import InfoCard from "@/components/dashboard/info-card";
import { YearSelect } from "@/components/dashboard/year-select";
import { constructMetadata, siteConfig } from "@/config/site";
import { groupPaymentsByDay } from "@/lib/payments";
import { currentSeason, seasonRange } from "@/lib/season";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
	title: `Admin - ${siteConfig.name}`,
	description: "Admin page for only admin management.",
});

const YearSchema = z.coerce.number().int();

export default async function AdminPage({
	searchParams,
}: {
	searchParams: Promise<{ year?: string }>;
}) {
	const t = await getTranslations("AdminPage");
	const user = await getSessionUser();
	if (!user || user.role !== "ADMIN") redirect("/login");

	const years = await getAdminYears();
	// A missing, malformed or unknown year falls back to the season in progress
	// rather than failing: a dashboard reached from a stale link should still
	// show something true.
	const requested = YearSchema.safeParse((await searchParams).year);
	const year =
		requested.success && years.includes(requested.data)
			? requested.data
			: currentSeason();

	const { start, end } = seasonRange(year);
	const [stats, payments] = await Promise.all([
		getAdminYearStats(year),
		getPayments({ start, end }),
	]);

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

	const season = t("season", { year });

	return (
		<div className="container mt-10">
			<DashboardHeader
				heading={t("header_title")}
				text={t("header_description")}
			>
				<YearSelect year={year} years={years} />
			</DashboardHeader>
			<div className="mt-6 flex flex-col gap-5">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<InfoCard title={t("users")} value={stats.users} text={season} />
					<InfoCard
						title={t("members")}
						value={stats.members}
						icon={UserCheck}
						text={season}
					/>
					<InfoCard
						title={t("not_members")}
						value={stats.nonMembers}
						icon={UserX}
						text={season}
					/>
					<GenderCard maleCount={stats.male} femaleCount={stats.female} />
				</div>
				<div className="flex flex-col gap-5">
					<div className="grid grid-cols-1 gap-4">
						<div className="col-span-1">
							<PaymentsByDay payments={groupPaymentsByDay(payments)} />
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
