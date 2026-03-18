"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import addPayment from "@/actions/addPayment";
import { Input } from "@/components/extendui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/extendui/select";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { MEMBERSHIP_PRICE, NEXT_YEAR } from "@/config/constants";

const PaymentFormSchema = z.object({
	paymentMethod: z.string(),
	description: z.string(),
	note: z.string().optional(),
});

type FormData = z.infer<typeof PaymentFormSchema>;

export function PaymentForm({
	userId,
	onSubmit,
}: {
	userId: string;
	onSubmit?: () => void;
}) {
	const form = useForm<FormData>({
		resolver: zodResolver(PaymentFormSchema),
		defaultValues: {
			description: `Tesseramento VLM ${NEXT_YEAR}`,
		},
	});
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const t = useTranslations("PaymentForm");

	async function handleSubmit(data: FormData) {
		setIsLoading(true);
		const res = await addPayment({
			userId,
			paymentMethod: data.paymentMethod,
			description: data.description,
			amount: MEMBERSHIP_PRICE * 100, // 40 euro
			slug: `VLM-${NEXT_YEAR}`,
			note: data.note,
		});
		setIsLoading(false);
		if (res?.error) {
			const description =
				res.message === "membership_already_exists"
					? t(res.message)
					: t("payment_error");
			return toast.error("Errore", { description });
		}
		onSubmit?.();
		return toast.success("OK!", { description: t("payment_success") });
	}

	return (
		<div className="grid gap-6">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
					<div className="space-y-6">
						<FormField
							control={form.control}
							name="paymentMethod"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("paymentMethod")}</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={t("paymentMethod")} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="bank_transfer">
												{t("bank_transfer")}
											</SelectItem>
											<SelectItem value="cash">{t("cash")}</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("description")}</FormLabel>
									<FormControl>
										<Input placeholder={t("description")} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="note"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("note")}</FormLabel>
									<FormControl>
										<Textarea placeholder={t("note")} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="mt-8 grid gap-2">
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
