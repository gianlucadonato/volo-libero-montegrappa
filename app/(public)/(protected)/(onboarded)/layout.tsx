import { redirect } from "next/navigation";
import { getOnboardingStatus } from "@/lib/onboarding";
import { getSessionUser } from "@/lib/session";

/**
 * The member pages need a complete profile, not just an account: a user who
 * verified the email but abandoned the profile form is sent back to finish it.
 * The parent layout has already checked the session and the email.
 */
export default async function OnboardedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getSessionUser();
	if (!user) redirect("/login");
	const status = await getOnboardingStatus(user.id);
	if (status === "unverified") redirect("/verify-email");
	if (status !== "complete") redirect("/profile/edit");
	return children;
}
