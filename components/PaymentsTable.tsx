"use client";

import { format } from "date-fns";
import { DownloadIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Payment, User } from "@/prisma/generated/client";

type PaymentWithCreator = Payment & { creator?: User };

export default function PaymentsTable({
	payments,
	title,
	showAdminFields = false,
}: {
	payments: PaymentWithCreator[];
	title?: string | null;
	showAdminFields?: boolean;
}) {
	const t = useTranslations("PaymentsTable");
	return (
		<Card className="mt-4 xl:col-span-2">
			<CardHeader className="flex flex-row items-center">
				<div className="grid">
					{title !== null && (
						<CardTitle>{title || t("your_memberships")}</CardTitle>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("payment_date")}</TableHead>
							<TableHead>{t("payment_method")}</TableHead>
							<TableHead>{t("amount")}</TableHead>
							<TableHead>{t("description")}</TableHead>
							{showAdminFields && <TableHead>{t("note")}</TableHead>}
							{showAdminFields && <TableHead>{t("creator")}</TableHead>}
							{/* <TableHead>{t('id_transaction')}</TableHead> */}
							<TableHead className="text-right">{t("invoice")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{payments.map((payment) => (
							<TableRow key={payment.id}>
								<TableCell>
									{format(payment.createdAt, "dd/MM/yyyy HH:mm")}
								</TableCell>
								<TableCell>{t(payment.paymentMethod)}</TableCell>
								<TableCell>
									{(Number(payment.amount) / 100).toFixed(2)} €
								</TableCell>
								<TableCell>{payment.description}</TableCell>
								{showAdminFields && (
									<>
										<TableCell>{payment.note}</TableCell>
										<TableCell>
											{payment.creator
												? `${payment.creator.firstName} ${payment.creator?.lastName}`
												: "system"}
										</TableCell>
									</>
								)}
								{/* <TableCell>
                  <div className="text-sm text-muted-foreground"
                    onClick={() => payment.stripePaymentIntentId && navigator.clipboard.writeText(payment.stripePaymentIntentId)}>
                    {payment.stripePaymentIntentId}
                  </div>
                </TableCell> */}
								<TableCell>
									{!!payment.stripeReceiptUrl && (
										<Link href={payment.stripeReceiptUrl} target="_blank">
											<div className="mt-1 flex items-center justify-end">
												<DownloadIcon className="mr-1 inline-block size-4" />
												{t("invoice")}
											</div>
										</Link>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
