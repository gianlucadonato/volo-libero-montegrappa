import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

// A stable "my XC profile" link for menus, which can't know the user's id.
// `/xc/me` is a protected route, so the proxy sends anonymous visitors to the
// login page and back here afterwards.
export default async function MyXcProfilePage() {
	const user = await getSessionUser();
	if (!user) redirect("/login?callbackUrl=%2Fxc%2Fme");
	redirect(`/xc/users/${user.id}`);
}
