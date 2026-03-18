import { getTranslations } from "next-intl/server";
import getUsers from "@/actions/getUsers";
import UsersList from "@/components/admin/UsersList";
import { DashboardHeader } from "@/components/dashboard/header";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Users - ${siteConfig.name}`,
	description: "List all users.",
});

export default async function AdminUsersPage() {
	const t = await getTranslations("AdminUsersPage");
	const allUsers = await getUsers();
	return (
		<div className="container mt-10">
			<DashboardHeader
				heading={t("header_title")}
				text={t("header_description")}
			/>
			<div className="mt-4 flex flex-col gap-5">
				<UsersList data={allUsers} />
			</div>
		</div>
	);
}
