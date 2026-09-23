"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { NEXT_YEAR } from "@/config/constants";
import { sendPaymentConfirmationEmail } from "@/emails/sendPaymentConfirmationEmail";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const PaymentSchema = z.object({
	userId: z.string(),
	paymentMethod: z.string(),
	description: z.string(),
	amount: z.number(),
	slug: z.string(),
	note: z.string().optional(),
});
type FormData = z.infer<typeof PaymentSchema>;

export default async function addPayment(data: FormData) {
	const log = logger.child({ action: "addPayment" });
	const sessionUser = await getSessionUser();
	if (!sessionUser || sessionUser.role !== "ADMIN") {
		return undefined;
	}
	try {
		// Deliberately does not touch `user.role`. Membership is the
		// `user_membership` row written below, which carries the year; the role
		// has none, so setting it here only produced a flag that said "member"
		// forever once someone had paid once. Whether a user is a socio is read
		// from the rows, by `isSocio`.
		const user = await prisma.user.findUnique({ where: { id: data.userId } });

		if (!user) {
			return { error: true, message: "User not found" };
		}

		const payment = await prisma.payment.create({
			data: {
				...data,
				createdBy: sessionUser.id,
			},
		});
		log.info({ paymentId: payment.id, userId: user.id }, "payment created");
		metrics.paymentsCreated.inc();

		const membership = await prisma.membership.findFirst({
			where: { year: NEXT_YEAR },
		});

		if (!membership) {
			return { error: true, message: "membership_not_found" };
		}

		try {
			const userMembership = await prisma.userMembership.create({
				data: {
					userId: user.id,
					membershipId: membership.id,
					year: NEXT_YEAR,
					description: membership.name,
					status: "active",
					validFrom: membership.validFrom,
					validUntil: membership.validUntil,
				},
			});
			log.info(
				{ userMembershipId: userMembership.id, userId: user.id },
				"user membership created",
			);
		} catch (_err) {
			return { error: true, message: "membership_already_exists" };
		}

		const coupon = await prisma.coupon.findFirst({
			where: { userId: null, year: NEXT_YEAR, type: "socio" },
		});
		if (!coupon) {
			throw new Error("Coupon not found!");
		}
		await prisma.coupon.update({
			where: { id: coupon.id },
			data: { userId: user.id },
		});

		await sendPaymentConfirmationEmail({
			user,
			payment,
			couponCode: coupon.code,
		});

		revalidatePath("/admin");
		return { success: true, payment };
	} catch (error) {
		log.error({ err: error }, "addPayment action failed");
		return { error: true, message: (error as Error).message };
	}
}
