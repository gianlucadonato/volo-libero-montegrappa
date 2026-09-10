"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { capitalize } from "es-toolkit";
import { Loader2, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { isSafeCallbackUrl } from "@/helpers/authRedirect";
import { authClient } from "@/lib/auth-client";
import { SignupSchema } from "@/schemas";

type FormData = z.infer<typeof SignupSchema>;

export function SignupForm({ callbackUrl }: { callbackUrl?: string }) {
	const form = useForm<FormData>({
		resolver: zodResolver(SignupSchema),
	});
	const { errors } = form.formState;
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const searchParams = useSearchParams();
	const t = useTranslations("SignupForm");
	const emsg = useTranslations("FormMessageI18N");
	const router = useRouter();

	async function onSubmit(data: FormData) {
		if (data.password !== data.confirmPassword) {
			const message = t("errors.password_dont_match");
			form.setError("password", {
				type: "validate",
				message,
			});
			form.setError("confirmPassword", {
				type: "validate",
				message,
			});
			toast.error(t("errors.message"), {
				description: message,
			});
			return;
		}

		form.clearErrors("password");
		form.clearErrors("confirmPassword");

		setIsLoading(true);
		await authClient.signUp.email(
			{
				email: data.email,
				password: data.password,
				name: capitalize(data.firstName.trim().toLowerCase()),
				firstName: capitalize(data.firstName.trim().toLowerCase()),
				lastName: capitalize(data.lastName.trim().toLowerCase()),
			},
			{
				onSuccess: () => {
					// The query value is validated before use; the prop is ours, so it
					// is trusted as-is.
					const fromQuery = searchParams.get("callbackUrl");
					const callbackURL =
						fromQuery && isSafeCallbackUrl(fromQuery) ? fromQuery : callbackUrl;
					callbackURL && router.push(callbackURL);
				},
				onError: (ctx) => {
					toast.error(t("errors.message"), {
						description:
							ctx.error.message ||
							"Your sign up request failed. Please try again.",
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
		<div className="grid gap-6">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<div className="space-y-2">
						<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>Nome</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="Nome"
												error={Boolean(errors.firstName)}
												textError={getErrorMessage(
													errors.firstName,
													"firstName",
												)}
												{...field}
											></Input>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem className="col-span-1">
										<FormLabel>Cognome</FormLabel>
										<FormControl>
											<Input
												type="text"
												placeholder="Cognome"
												error={Boolean(errors.lastName)}
												textError={getErrorMessage(errors.lastName, "lastName")}
												{...field}
											></Input>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
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
						<div className="grid gap-1">
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>Conferma Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												error={Boolean(errors.confirmPassword)}
												textError={getErrorMessage(
													errors.confirmPassword,
													"confirmPassword",
												)}
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
						<div className="grid gap-1">
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
								{t("submit")}
							</Button>
						</div>
					</div>
				</form>
			</Form>
		</div>
	);
}
