import getUserCoupon from "@/actions/getUserCoupon";
import CouponCodeCard from "@/components/CouponCodeCard";
import PurchaseSuccessCard from "@/components/PurchaseSuccessCard";
import TelegramCard from "@/components/TelegramCard";
import { constructMetadata, siteConfig } from "@/config/site";

export const metadata = constructMetadata({
	title: `Conferma Iscrizione - ${siteConfig.name}`,
	description: "Iscrizione avvenuta con successo!",
});

export default async function MembershipSuccessPage() {
	const userCoupon = await getUserCoupon();
	return (
		<div className="font-mono">
			<div className="container mb-6">
				<PurchaseSuccessCard />
				<CouponCodeCard couponCode={userCoupon?.code || "-"} />
				<div>
					<TelegramCard />
				</div>
			</div>
		</div>
	);
}
