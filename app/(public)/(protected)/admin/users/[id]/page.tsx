import AdminUserView from "@/components/admin/AdminUserView";
import { constructMetadata, siteConfig } from "@/config/site";
import { getUserById } from "@/lib/user";

export const metadata = constructMetadata({
	title: `User - ${siteConfig.name}`,
	description: "User details page",
});

export default async function AdminUserPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getUserById(id);
	if (!user) {
		return <div>User not found</div>;
	}
	return (
		<div className="container mt-10">
			<AdminUserView user={user} />
		</div>
	);
}
