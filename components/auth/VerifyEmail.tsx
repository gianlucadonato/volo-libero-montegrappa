"use client";

import { Loader2, MailCheck, MailWarning } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/extendui/input";
import { Button } from "@/components/ui/button";
import { withCallbackUrl } from "@/helpers/authRedirect";
import { authClient } from "@/lib/auth-client";

/** Seconds before another link may be requested, to spare the inbox. */
const RESEND_COOLDOWN = 60;

export default function VerifyEmail({
	email: initialEmail,
	isLoggedIn,
	error,
	callbackUrl,
}: {
	email?: string;
	isLoggedIn: boolean;
	error?: string;
	callbackUrl?: string;
}) {
	const t = useTranslations("VerifyEmailPage");
	const router = useRouter();
	const [email, setEmail] = useState(initialEmail ?? "");
	const [isSending, setIsSending] = useState(false);
	const [cooldown, setCooldown] = useState(0);

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	async function resend() {
		if (!email) return;
		setIsSending(true);
		const { error: sendError } = await authClient.sendVerificationEmail({
			email,
			// Back here once verified, so this page can forward the user on.
			callbackURL: withCallbackUrl("/verify-email", callbackUrl),
		});
		setIsSending(false);
		if (sendError) {
			toast.error(t("resend_error"));
			return;
		}
		toast.success(t("resend_success"));
		setCooldown(RESEND_COOLDOWN);
	}

	async function signOut() {
		await authClient.signOut();
		router.push(withCallbackUrl("/login", callbackUrl));
		router.refresh();
	}

	const hasError = Boolean(error);
	const Icon = hasError ? MailWarning : MailCheck;

	return (
		<div className="mx-auto flex w-full max-w-md flex-col space-y-6 text-center">
			<div className="flex justify-center">
				<Icon
					className={hasError ? "size-12 text-destructive" : "size-12"}
					strokeWidth={1.5}
				/>
			</div>
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">
					{hasError ? t("error_title") : t("title")}
				</h1>
				<p className="text-sm text-muted-foreground">
					{hasError
						? t("error_description")
						: initialEmail
							? t.rich("description_with_email", {
									email: initialEmail,
									strong: (chunks) => (
										<strong className="text-foreground">{chunks}</strong>
									),
								})
							: t("description")}
				</p>
				{!hasError && (
					<p className="text-sm text-muted-foreground">{t("next_step")}</p>
				)}
			</div>

			<div className="grid gap-2 text-left">
				{/* Only asked for when the page does not know it, i.e. back from an
				    invalid link. Otherwise the address is the one just signed up
				    with, and editing it would not change the account anyway. */}
				{!initialEmail && (
					<Input
						type="email"
						autoCapitalize="none"
						autoComplete="email"
						autoCorrect="off"
						placeholder="your@email.com"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						aria-label="Email"
					/>
				)}
				<Button onClick={resend} disabled={!email || isSending || cooldown > 0}>
					{isSending && <Loader2 className="mr-2 size-4 animate-spin" />}
					{cooldown > 0 ? t("resend_wait", { seconds: cooldown }) : t("resend")}
				</Button>
				<p className="text-center text-xs text-muted-foreground">
					{t("spam_hint")}
				</p>
			</div>

			<p className="text-sm text-muted-foreground">
				{isLoggedIn ? (
					<button
						type="button"
						onClick={signOut}
						className="hover:text-brand underline underline-offset-4"
					>
						{t("use_another_account")}
					</button>
				) : (
					<span className="flex flex-col gap-2">
						<Link
							href={withCallbackUrl("/login", callbackUrl)}
							className="hover:text-brand underline underline-offset-4"
						>
							{t("already_verified")}
						</Link>
						{initialEmail && (
							<Link
								href={withCallbackUrl("/signup", callbackUrl)}
								className="hover:text-brand underline underline-offset-4"
							>
								{t("wrong_email")}
							</Link>
						)}
					</span>
				)}
			</p>
		</div>
	);
}
