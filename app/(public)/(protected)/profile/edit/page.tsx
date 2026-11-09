import Image from "next/image";
import { getTranslations } from "next-intl/server";
import getUserDetails from "@/actions/getUserDetails";
import { UserForm } from "@/components/forms/user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { constructMetadata, siteConfig } from "@/config/site";
import { isSafeCallbackUrl } from "@/helpers/authRedirect";
import { isProfileComplete } from "@/helpers/onboarding";

export const metadata = constructMetadata({
	title: `Profilo - ${siteConfig.name}`,
	description: "Pagina profilo",
});

export default async function ProfileEditPage({
	searchParams,
}: {
	searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
	const t = await getTranslations("ProfilePage");
	const user = await getUserDetails();
	if (!user) return null;

	// Sent here by an onboarding gate, the user goes back where they were headed
	// once the profile is saved; otherwise on to the membership page as before.
	const { callbackUrl: requested } = await searchParams;
	const callbackUrl =
		typeof requested === "string" && isSafeCallbackUrl(requested)
			? requested
			: "/membership";
	const isComplete = isProfileComplete(user);

	return (
		<div>
			<div className="container mx-auto my-10 max-w-6xl">
				<Card className="mt-8">
					<CardHeader>
						<div className="flex justify-center">
							<Image
								width="80"
								height="80"
								src="/logo/LOGO_CLUB.png"
								alt="logo club"
							/>
						</div>
						<CardTitle className="text-center text-2xl font-bold">
							{t("pilot_profile")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{!isComplete && (
							<div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
								<p className="font-semibold">{t("complete_profile_title")}</p>
								<p>{t("complete_profile_description")}</p>
							</div>
						)}
						<UserForm user={user} callbackUrl={callbackUrl} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
