import type { Viewport } from "next";
import Signup from "@/components/auth/Signup";
import { constructMetadata } from "@/config/site";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export const metadata = constructMetadata({
	title: "Sign Up",
	description: "Sign up for a new account",
});

export default function SignupPage() {
	return (
		<div className="container mx-auto flex h-screen w-full flex-col items-center justify-center">
			<div className="mt-[-20%] w-full">
				<Signup />
			</div>
		</div>
	);
}
