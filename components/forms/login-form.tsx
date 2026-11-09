"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { type FieldError, useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";
import { Input } from "@/components/extendui/input";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { isSafeCallbackUrl, withCallbackUrl } from "@/helpers/authRedirect";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { LoginSchema } from "@/schemas";

type FormData = z.infer<typeof LoginSchema>;

export function LoginForm({
	className,
	onClick,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) {
	const form = useForm<FormData>({
		resolver: zodResolver(LoginSchema),
	});
	const { errors } = form.formState;
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const searchParams = useSearchParams();
	const t = useTranslations("LoginForm");
	const emsg = useTranslations("FormMessageI18N");
	const router = useRouter();
	const pathname = usePathname();

	async function onSubmit(data: FormData) {
		// Validated, never trusted as-is: the value comes from the query string,
		// so an off-site URL would make this an open redirect.
		const fromQuery = searchParams.get("callbackUrl");
		// In the sign-in modal the user stays on the page they are reading, so
		// that is also where an emailed verification link should bring them back.
		const fallback =
			onClick && isSafeCallbackUrl(pathname) ? pathname : "/profile";
		const target =
			fromQuery && isSafeCallbackUrl(fromQuery) ? fromQuery : fallback;

		setIsLoading(true);
		await authClient.signIn.email(
			{
				...data,
				rememberMe: true,
				// Only used when the email is not verified yet: better-auth then
				// mails a fresh link, which comes back through the verify page.
				callbackURL: withCallbackUrl("/verify-email", target),
			},
			{
				onSuccess: () => {
					if (onClick) return onClick();
					router.push(target);
				},
				onError: (ctx) => {
					if (ctx.error.code === "EMAIL_NOT_VERIFIED") {
						onClick?.();
						const query = new URLSearchParams({
							email: data.email.trim(),
							callbackUrl: target,
						});
						router.push(`/verify-email?${query}`);
						return;
					}
					toast.error(t("errors.message"), {
						description:
							ctx.error.message ||
							"Your sign in request failed. Please try again.",
					});
				},
			},
		);
		setIsLoading(false);
	}

	function getErrorMessage(error: FieldError | undefined, name: string) {
		const tMessage = error
			? name
				? emsg.has(`${name}.${error.type}`)
					? `${name}.${error.type}`
					: error.type
				: error.type
			: null;
		let message = error && String(error?.message);
		if (tMessage) {
			message = emsg.has(tMessage) ? emsg(tMessage) : message;
		}
		return message;
	}

	return (
		<div className={cn("grid gap-6", className)} {...props}>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid gap-2">
						<div className="grid gap-1">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												autoCapitalize="none"
												autoComplete="email"
												autoCorrect="off"
												placeholder="your@email.com"
												error={Boolean(errors.email)}
												textError={getErrorMessage(errors.email, "email")}
												{...field}
											>
												<Input.Group>
													<Input.RightIcon>
														<Mail />
													</Input.RightIcon>
												</Input.Group>
											</Input>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
						<div className="grid gap-1">
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												error={Boolean(errors.password)}
												textError={getErrorMessage(errors.password, "password")}
												placeholder="********"
												{...field}
											>
												<Input.Group>
													<Input.PasswordToggle />
												</Input.Group>
											</Input>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
						<div className="mb-4 flex items-center justify-end">
							<Link
								href={withCallbackUrl(
									"/reset-password",
									searchParams.get("callbackUrl"),
								)}
								onClick={onClick}
								className="text-sm underline"
							>
								{t("forgot_password")}
							</Link>
						</div>
						<Button type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
							{t("submit")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
