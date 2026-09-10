"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { AuthLink } from "@/components/auth/AuthLink";
import { LoginForm } from "@/components/forms/login-form";

export default function Login({ onClick }: { onClick?: () => void }) {
	const t = useTranslations("LoginPage");
	return (
		<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-87.5">
			<div className="flex flex-col space-y-2 text-center">
				<Image
					src="/logo/LOGO_CLUB.png"
					alt="logo club"
					className="mx-auto"
					width={100}
					height={100}
				/>
				<h1 className="text-2xl font-semibold tracking-tight">
					{t("welcome")}
				</h1>
				<p className="text-sm text-muted-foreground">{t("access_account")}</p>
			</div>
			<Suspense>
				<LoginForm onClick={onClick} />
			</Suspense>
			<p className="px-8 text-center text-sm text-muted-foreground">
				<Suspense>
					<AuthLink
						href="/signup"
						onClick={onClick}
						className="hover:text-brand underline underline-offset-4"
					>
						{t("dont_have_account")}
					</AuthLink>
				</Suspense>
			</p>
		</div>
	);
}
