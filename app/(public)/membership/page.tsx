import { getTranslations } from "next-intl/server";
import getUserMembership from "@/actions/getUserMembership";
import PurchaseMembershipCard from "@/components/PurchaseMembershipCard";
import { NEXT_YEAR } from "@/config/constants";
import { constructMetadata, siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
	title: `Membership - ${siteConfig.name}`,
	description: "Diventa socio o rinnova la tua iscrizione al club.",
});

export default async function MembershipPage() {
	const t = await getTranslations("MembershipPage");
	const user = await getSessionUser();
	const membership = await getUserMembership({
		userId: user?.id,
		year: NEXT_YEAR,
	});

	return (
		<div>
			<div className="mb-12 font-mono">
				<div className="overflow-hidden">
					<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/bg-montegrappa.webp')] bg-cover bg-left">
						<div
							style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
							className="flex h-full flex-col items-center justify-center px-2"
						>
							<h1 className="text-2xl font-bold text-white">
								{t("join_the_club")}
							</h1>
							<h3 className="pt-2 text-center text-sm text-white">
								{t("join_the_club_subtext")}
							</h3>
						</div>
					</div>
				</div>
				<div className="container mx-auto mt-10">
					<PurchaseMembershipCard user={user} membership={membership} />
				</div>
			</div>
		</div>
	);
}
