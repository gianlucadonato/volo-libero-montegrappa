import type { Viewport } from "next";
import NewPassword from "@/components/auth/NewPassword";
import { constructMetadata } from "@/config/site";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export const metadata = constructMetadata({
	title: "New Password",
	description: "Set a new password for your account",
});

export default function NewPasswordPage() {
	return (
		<div className="container mx-auto flex h-screen w-full flex-col items-center justify-center">
			<div className="mt-[-20%] w-full">
				<NewPassword />
			</div>
		</div>
	);
}
