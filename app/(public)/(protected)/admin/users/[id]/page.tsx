import { constructMetadata, siteConfig } from "@/config/site";
import { getUserById } from "@/lib/user";
import AdminUserView from "./AdminUserView";

export const metadata = constructMetadata({
  title: `User - ${siteConfig.name}`,
  description: "User details page",
});

export default async function AdminUserPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUserById(params.id);
  if (!user) {
    return <div>User not found</div>;
  }
  return (
    <div className="container mt-10">
      <AdminUserView user={user} />
    </div>
  );
}
