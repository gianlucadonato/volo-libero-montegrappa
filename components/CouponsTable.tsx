"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Coupon } from "@/prisma/generated/client";

export default function CouponsTable({ coupons }: { coupons: Coupon[] }) {
	return (
		<Card className="mt-4 xl:col-span-2">
			<CardHeader className="flex flex-row items-center">
				<div className="grid">CoupCoupons Flycard</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Codice</TableHead>
							<TableHead>Anno</TableHead>
							<TableHead>Inizio validità</TableHead>
							<TableHead>Fine Validità</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{coupons.map((coupon) => (
							<TableRow key={coupon.id}>
								<TableCell>{coupon.code}</TableCell>
								<TableCell>{coupon.year}</TableCell>
								<TableCell>
									{coupon.validFrom &&
										format(coupon.validFrom.toString(), "dd/MM/yyyy")}
								</TableCell>
								<TableCell>
									{coupon.validUntil &&
										format(coupon.validUntil.toString(), "dd/MM/yyyy")}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
