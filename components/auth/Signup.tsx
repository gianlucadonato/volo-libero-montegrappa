"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { AuthLink } from "@/components/auth/AuthLink";
import { SignupForm } from "@/components/forms/signup-form";

export default function SignupPage() {
	const t = useTranslations("SignupPage");
	return (
		<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-87.5">
			<div className="flex flex-col space-y-2 text-center">
				<div className="flex items-center justify-center mb-4">
					<div className="h-20 w-20 overflow-hidden rounded-full">
						<Image
							width="80"
							height="80"
							src="/logo/LOGO_CLUB.png"
							alt="logo"
						/>
					</div>
				</div>
				<h1 className="text-2xl font-semibold tracking-tight">
					{t("welcome")}
				</h1>
				<p className="text-sm text-muted-foreground">{t("create_account")}</p>
			</div>
			<Suspense>
				<div className="container mx-auto px-2">
					<SignupForm callbackUrl="/profile/edit" />
				</div>
			</Suspense>
			<p className="px-8 text-center text-sm text-muted-foreground">
				<Suspense>
					<AuthLink
						href="/login"
						className="hover:text-brand underline underline-offset-4"
					>
						{t("already_have_account")}
					</AuthLink>
				</Suspense>
			</p>
		</div>
	);
}
