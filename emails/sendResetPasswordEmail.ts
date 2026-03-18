import { render } from "@react-email/components";
import { ResetPasswordEmail } from "@/emails/template/reset-password-email";
import { sendMail } from "@/lib/sendMail";

type User = {
	email: string;
	firstName: string;
	state: string | null;
};

export const sendResetPasswordEmail = async ({
	user,
	token,
}: {
	user: User;
	token: string;
}) => {
	const emailHtml = await render(ResetPasswordEmail({ user, token }));
	const text = await render(ResetPasswordEmail({ user, token }), {
		plainText: true,
	});
	await sendMail({
		sendTo: user.email,
		subject: "Reset Password",
		text,
		html: emailHtml,
	});
	console.log("✅ ResetPassword Email sent!", user.email);
};
