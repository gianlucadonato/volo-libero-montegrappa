"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { type FieldError, useForm } from "react-hook-form";
import { FaSpinner } from "react-icons/fa";
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
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { NewPasswordSchema } from "@/schemas";

type FormData = z.infer<typeof NewPasswordSchema>;

export function NewPasswordForm({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const form = useForm<FormData>({
		resolver: zodResolver(NewPasswordSchema),
	});
	const {
		formState: { errors },
	} = form;
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const t = useTranslations("NewPasswordPage");
	const emsg = useTranslations("FormMessageI18N");
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const router = useRouter();

	async function onSubmit(data: FormData) {
		if (!token) {
			return toast.error(t("errors.message"), {
				description: "Token is required",
			});
		}
		if (data.password !== data.confirmPassword) {
			const message = t("errors.password_mismatch");
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
		setIsLoading(true);
		const { error } = await authClient.resetPassword({
			newPassword: data.password,
			token,
		});
		setIsLoading(false);
		if (error) {
			return toast.error(t("errors.message"), {
				description: error.message || t("errors.description"),
			});
		} else {
			toast.success(t("success.message"), {
				description: t("success.description"),
			});
			router.push("/login");
		}
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
						<div className="mb-4 grid gap-1">
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>{t("new_password")}</FormLabel>
										<FormControl>
											<Input
												type="password"
												error={Boolean(errors.password)}
												textError={getErrorMessage(
													errors.password,
													"newPassword",
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
						<div className="mb-4 grid gap-1">
							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem className="col-span-2">
										<FormLabel>{t("confirm_password")}</FormLabel>
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
						<Button type="submit" disabled={isLoading}>
							{isLoading && <FaSpinner className="mr-2 size-4 animate-spin" />}
							{t("submit")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
