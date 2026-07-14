"use client";

import { Printer, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/extendui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import MembershipCard, { type MembershipCardProps } from "./MembershipCard";

/**
 * Wraps a {@link MembershipCard} in a clickable trigger that opens a
 * fullscreen dialog showing the card enlarged (ideal for displaying the
 * membership from a phone) with a print action.
 */
export default function MembershipCardDialog(props: MembershipCardProps) {
	const t = useTranslations("MembershipCard");

	return (
		<Dialog>
			<DialogTrigger asChild>
				<button
					type="button"
					aria-label={t("apri_tessera")}
					className="group block w-full cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<MembershipCard
						{...props}
						className="transition-transform duration-200 group-hover:scale-[1.02] group-hover:shadow-2xl"
					/>
				</button>
			</DialogTrigger>
			<DialogContent className="max-w-[calc(100%-1.5rem)] gap-5 border-none p-4 sm:max-w-lg">
				<DialogTitle className="sr-only">
					{t("tessera_socio")} {props.year}
				</DialogTitle>
				<div className="membership-print-area">
					<MembershipCard {...props} qrSize={120} />
				</div>
				<div className="no-print flex flex-wrap justify-center gap-2">
					{props.verifyUrl && (
						<Button variant="outline" asChild>
							<Link
								href={props.verifyUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ShieldCheck className="mr-2 size-4" />
								{t("verifica")}
							</Link>
						</Button>
					)}
					<Button variant="outline" onClick={() => window.print()}>
						<Printer className="mr-2 size-4" />
						{t("stampa")}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
