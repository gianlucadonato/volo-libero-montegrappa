"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Payment } from "@/prisma/generated/client";
import PaymentsDataTable from "./PaymentsDataTable";

export default function PaymentsList({ data }: { data: Payment[] }) {
	return (
		<Card className="xl:col-span-2">
			<CardContent>
				<PaymentsDataTable data={data} />
			</CardContent>
		</Card>
	);
}
