"use client";

import { AlertCircle, Landmark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { MEMBERSHIP_PRICE, NEXT_YEAR } from "@/config/constants";
import { useAuthHref } from "@/hooks/use-auth-href";
import type { UserMembership } from "@/prisma/generated/client";

import type { SessionUser } from "@/types";
import PricingCard from "./PricingCard";
import PurchaseButton from "./PurchaseButton";

export default function PurchaseMembershipCard({
	user,
	membership,
}: {
	user?: SessionUser;
	membership: UserMembership | null;
}) {
	const t = useTranslations("PurchaseMembershipCard");
	// Signing up or logging in from here returns to the membership page, where
	// the purchase the user came for is waiting.
	const { loginHref, signupHref } = useAuthHref();

	const features = [
		{ title: t("membership_club", { NEXT_YEAR }) },
		{ title: t("membership_flycard", { NEXT_YEAR }), info: true },
	];

	return (
		<Card className="mt-8">
			<CardHeader>
				<div className="flex justify-center">
					<Image
						width="80"
						height="80"
						src="/logo/LOGO_CLUB.png"
						alt="logo club"
					/>
				</div>
				<CardTitle className="text-center text-2xl font-bold">
					{t("membership")} {NEXT_YEAR}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="md:p-10">
					<h3 className="scroll-m-20 text-lg font-semibold tracking-tight">
						{t("info.membership.title")}
					</h3>
					<div>
						{t.rich("info.membership.description", {
							NEXT_YEAR,
							strong: (chunks) => <strong>{chunks}</strong>,
							br: () => <br />,
							link1: (chunks) => (
								<Link href={signupHref} className="underline">
									{chunks}
								</Link>
							),
							link2: (chunks) => (
								<Link href={loginHref} className="underline">
									{chunks}
								</Link>
							),
						})}
					</div>
					<div className="mt-4">
						<h3 className="scroll-m-20 text-lg font-semibold tracking-tight">
							{t("info.flycard.title")}
						</h3>
						<div>
							{t.rich("info.flycard.description", {
								strong: (chunks) => <strong>{chunks}</strong>,
								i: (chunks) => <i>{chunks}</i>,
								link1: (chunks) => (
									<a
										href="https://flycard.vivereilgrappa.it"
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										{chunks}
									</a>
								),
							})}
						</div>
					</div>
					<div className="mt-4">
						<h3 className="scroll-m-20 text-lg font-semibold tracking-tight">
							{t("info.news.title", { NEXT_YEAR })}
						</h3>
						<div>
							{t.rich("info.news.description", {
								strong: (chunks) => <strong>{chunks}</strong>,
								br: () => <br />,
								span: (chunks) => <span className="underline">{chunks}</span>,
							})}
						</div>
					</div>
					<div className="mt-4">
						<h3 className="scroll-m-20 text-lg font-semibold tracking-tight">
							{t("info.important.title")}
						</h3>
						<div>
							{t.rich("info.important.description", {
								strong: (chunks) => <strong>{chunks}</strong>,
								br: () => <br />,
								link1: (chunks) => (
									<a
										href="https://flycard.vivereilgrappa.it/rules"
										target="_blank"
										rel="noopener noreferrer"
										className="underline"
									>
										{chunks}
									</a>
								),
							})}
						</div>
					</div>
				</div>
				<div className="my-4 flex justify-center gap-4">
					<PricingCard
						features={features}
						price={MEMBERSHIP_PRICE}
						selected={true}
					/>
				</div>
				<div className="mt-10 flex justify-center">
					<div className="align-center mt-4 flex w-full flex-col justify-center pt-4 md:max-w-[500px] md:p-4">
						{Boolean(membership) && (
							<div className="mb-4">
								<Alert variant="destructive" className="bg-red-100">
									<AlertCircle className="size-4" />
									<AlertTitle>{t("alert_title")}</AlertTitle>
									<AlertDescription>
										{t("alert_description", { NEXT_YEAR })}
									</AlertDescription>
								</Alert>
							</div>
						)}
						<PurchaseButton
							isUser={Boolean(user)}
							isDisabled={Boolean(membership)}
						/>
						<div className="relative my-4">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									{t("or")}
								</span>
							</div>
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="outline" size="sm">
									<Landmark className="mr-1 size-4" />
									<span className="text-xs">{t("pay_with_bank_transfer")}</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Pagamento con Bonifico Bancario</DialogTitle>
									<DialogDescription>
										<div className="mt-4">
											Caro socio, <br />
											se preferisci pagare la quota di iscrizione tramite
											bonifico bancario, (anzichè online con carta di credito)
											segui questa procedura: <br />
											<ul className="mb-4 mt-2">
												<li>
													1. Effettua il bonifico a queste coordinate bancarie:
												</li>
												<li className="mb-2 mt-4">
													<code>
														<strong>ASD VOLOLIBERO MONTEGRAPPA</strong> <br />
														Banca del Veneto Centrale – Filiale di Borso del
														Grappa <br />
														<strong>IBAN:</strong> IT78B0859061490000900030664{" "}
														<br />
														<strong>Causale:</strong> Iscrizione socio{" "}
														{NEXT_YEAR} - [Nome Cognome] <br />
														<strong>Importo:</strong> {MEMBERSHIP_PRICE}&euro;{" "}
														<br />
													</code>
													​​​​
												</li>
												<li className="mb-2">
													2. Inviaci per email la ricevuta del bonifico a{" "}
													<u>
														<a href="mailto:segreteria@vololiberomontegrappa.it">
															segreteria@vololiberomontegrappa.it
														</a>
													</u>
												</li>
												<li>
													3. Una volta ricevuta l&apos;email ti attiveremo
													questo account con il quale ti sei registrato e ti
													inseriremo nella lista soci!
												</li>
											</ul>
											Per qualsiasi domanda scrivici pure a{" "}
											<u>
												<a href="mailto:segreteria@vololiberomontegrappa.it">
													segreteria@vololiberomontegrappa.it
												</a>
											</u>
											<br />
											<br />
											Grazie! <br />
										</div>
									</DialogDescription>
								</DialogHeader>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
