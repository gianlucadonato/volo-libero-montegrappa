"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { type FieldError, useForm } from "react-hook-form";
import { FaSpinner } from "react-icons/fa";
import { toast } from "sonner";
import type * as z from "zod";
import { Input } from "@/components/extendui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ResetPasswordSchema } from "@/schemas";

type FormData = z.infer<typeof ResetPasswordSchema>;

export function ResetPasswordForm({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const form = useForm<FormData>({
		resolver: zodResolver(ResetPasswordSchema),
	});
	const {
		formState: { errors },
	} = form;
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const [isSuccess, setIsSuccess] = React.useState<boolean>(false);
	const t = useTranslations("ResetPasswordPage");
	const emsg = useTranslations("FormMessageI18N");

	async function onSubmit(form: FormData) {
		setIsLoading(true);
		const { error } = await authClient.requestPasswordReset({
			email: form.email,
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
			setIsSuccess(true);
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
			{isSuccess ? (
				<Alert className="text-dark-foreground border border-green-600 bg-green-50">
					<Send className="mr-2 size-4" />
					<AlertTitle>{t("email_sent.title")}</AlertTitle>
					<AlertDescription>{t("email_sent.description")}</AlertDescription>
				</Alert>
			) : (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-2">
							<div className="mb-4 grid gap-1">
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
													value={field.value}
													onChange={field.onChange}
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
							<Button type="submit" disabled={isLoading}>
								{isLoading && (
									<FaSpinner className="mr-2 size-4 animate-spin" />
								)}
								{t("submit")}
							</Button>
						</div>
					</form>
				</Form>
			)}
		</div>
	);
}
