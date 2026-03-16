import { NEXT_YEAR } from "@/config/constants";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function getUserCoupon() {
	const user = await getSessionUser();
	if (!user) {
		return undefined;
	}
	const userCoupon = await prisma.coupon.findFirst({
		where: {
			userId: user.id,
			year: NEXT_YEAR,
		},
	});

	return userCoupon;
}
