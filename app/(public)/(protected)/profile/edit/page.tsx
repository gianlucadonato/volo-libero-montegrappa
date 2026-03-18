import Image from "next/image";
import { getTranslations } from "next-intl/server";
import getUserDetails from "@/actions/getUserDetails";
import { UserForm } from "@/components/forms/user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Profilo - ${siteConfig.name}`,
	description: "Pagina profilo",
});

export default async function ProfileEditPage() {
	const t = await getTranslations("ProfilePage");
	const user = await getUserDetails();
	if (!user) return null;

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
						<UserForm user={user} callbackUrl="/membership" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
