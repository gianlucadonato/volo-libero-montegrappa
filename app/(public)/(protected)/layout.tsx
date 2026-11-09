import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

/**
 * Every page in here needs a verified email. Logging in already demands one,
 * but sessions opened before verification became mandatory are still alive,
 * so the check is repeated here rather than trusted to the login form.
 *
 * Pages that also need a complete profile live in `(onboarded)`; the profile
 * form, settings and the admin area only need the email.
 */
export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getSessionUser();
	if (!user) redirect("/login");
	if (!user.emailVerified) redirect("/verify-email");
	return children;
}
