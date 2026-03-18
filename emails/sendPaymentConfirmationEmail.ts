import { render } from "@react-email/components";
import { PaymentConfirmationEmail } from "@/emails/template/payment-confirmation-email";
import { sendMail } from "@/lib/sendMail";
import type { Payment, User } from "@/prisma/generated/client";

export const sendPaymentConfirmationEmail = async ({
	user,
	payment,
	couponCode,
}: {
	user: User;
	payment: Payment;
	couponCode: string;
}) => {
	if (!user) {
		console.error("User not found!");
		return;
	}
	if (!payment) {
		console.error("Payment not found!");
		return;
	}

	const emailHtml = await render(
		PaymentConfirmationEmail({ user, payment, couponCode }),
	);
	const text = await render(
		PaymentConfirmationEmail({ user, payment, couponCode }),
		{ plainText: true },
	);

	await sendMail({
		sendTo: user.email,
		subject: "Conferma del tuo tesseramento al Club V.L. Montegrappa",
		text,
		html: emailHtml,
	});
	console.log("✅ PaymentConfirmation Email sent!", user.email);
};
