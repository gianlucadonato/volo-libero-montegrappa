"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function CouponCodeCard({ couponCode }: { couponCode: string }) {
	return (
		<Card className="mt-8">
			<CardHeader className="flex flex-col items-center justify-center text-center">
				<CardTitle>
					<div className="text-xl">Codice Sconto Flycard</div>
				</CardTitle>
				<CardDescription>
					Usa questo codice per ottenere uno sconto sull&apos;acquisto della
					flycard (10euro) sul sito{" "}
					<a
						href="https://flycard.vivereilgrappa.it/"
						target="_blank"
						rel="noopener"
					>
						www.flycard.vivereilgrappa.it
					</a>
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center text-center">
				<div className="my-2 w-[250px]">
					<div>Il tuo codice coupon:</div>
					<div className="mt-1 text-2xl">
						<a
							href="https://flycard.vivereilgrappa.it/sale/flycard-details"
							target="_blank"
							rel="noreferrer"
						>
							<strong>{couponCode}</strong>
						</a>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
