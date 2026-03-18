"use client";

import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export default function ResetPassword() {
	const t = useTranslations("ResetPasswordPage");
	return (
		<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<div className="flex flex-col space-y-2 text-center">
				<Image
					src="/logo/LOGO_CLUB.png"
					alt="logo club"
					className="mx-auto"
					width={100}
					height={100}
				/>
				<h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
				<p className="text-sm text-muted-foreground">{t("description")}</p>
			</div>
			<Suspense>
				<ResetPasswordForm />
			</Suspense>
			<div className="px-8 text-center text-sm text-muted-foreground">
				<Link
					href="/login"
					className="hover:text-brand flex items-center justify-center underline underline-offset-4"
				>
					<ArrowLeftIcon className="mr-2 size-4" />
					{t("back_to_login")}
				</Link>
			</div>
		</div>
	);
}
