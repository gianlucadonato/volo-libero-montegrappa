import type { Viewport } from "next";
import ResetPassword from "@/components/auth/ResetPassword";
import { constructMetadata } from "@/config/site";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export const metadata = constructMetadata({
	title: "Reset Password",
	description: "Reset Password",
});

export default function ResetPasswordPage() {
	return (
		<div className="container mx-auto flex h-screen w-full flex-col items-center justify-center">
			<div className="mt-[-20%] w-full">
				<ResetPassword />
			</div>
		</div>
	);
}
