"use client";

import { isWithinInterval } from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/extendui/button";
import { NEXT_YEAR } from "@/config/constants";
import type { UserMembership } from "@/prisma/generated/client";
import MembershipCardDialog from "./MembershipCardDialog";

const FLYCARD_DESCRIPTION = "Flycard Vivere il Grappa 2025";

export interface MembershipCardsProps {
	userId: string;
	firstName: string;
	lastName: string;
	memberId: number;
	/** Year the user joined the club (from createdAt). */
	memberSince: number;
	memberships: UserMembership[];
}

function isMembershipActive(m: UserMembership): boolean {
	if (m.validFrom && m.validUntil) {
		return isWithinInterval(new Date(), {
			start: m.validFrom,
			end: m.validUntil,
		});
	}
	return m.status === "active";
}

export default function MembershipCards({
	userId,
	firstName,
	lastName,
	memberId,
	memberSince,
	memberships,
}: MembershipCardsProps) {
	const t = useTranslations("MembershipCard");

	const filtered = memberships.filter(
		(m) => m.description !== FLYCARD_DESCRIPTION,
	);
	const current = filtered.find((m) => m.year === NEXT_YEAR);
	const past = filtered
		.filter((m) => m.year !== NEXT_YEAR)
		.sort((a, b) => b.year - a.year);

	// NEXT_PUBLIC_* is inlined into the browser bundle at build time (see CLAUDE.md).
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
	const verifyUrl = `${baseUrl}/verifica/${userId}`;

	return (
		<div className="mt-4">
			<h3 className="font-heading text-lg uppercase tracking-wide text-muted-foreground">
				{t("la_mia_tessera")}
			</h3>
			<div className="mt-3 max-w-md">
				{current ? (
					<MembershipCardDialog
						firstName={firstName}
						lastName={lastName}
						memberId={memberId}
						sinceYear={memberSince}
						year={current.year}
						isActive={isMembershipActive(current)}
						verifyUrl={verifyUrl}
						variant="current"
					/>
				) : (
					<EmptyCard
						year={NEXT_YEAR}
						cta={t("iscriviti_cta")}
						label={t("nessuna_tessera", { year: NEXT_YEAR })}
					/>
				)}
			</div>

			{past.length > 0 && (
				<div className="mt-10">
					<h3 className="font-heading text-lg uppercase tracking-wide text-muted-foreground">
						{t("tessere_precedenti")}
					</h3>
					<div className="mt-3 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{past.map((m) => (
							<MembershipCardDialog
								key={m.id}
								firstName={firstName}
								lastName={lastName}
								memberId={memberId}
								sinceYear={memberSince}
								year={m.year}
								isActive={isMembershipActive(m)}
								variant="past"
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function EmptyCard({
	year,
	label,
	cta,
}: {
	year: number;
	label: string;
	cta: string;
}) {
	return (
		<div className="flex aspect-[1.6/1] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center">
			<p className="font-heading text-4xl uppercase text-muted-foreground/50">
				{year}
			</p>
			<p className="max-w-xs text-sm text-muted-foreground">{label}</p>
			<Button asChild size="sm">
				<Link href="/membership">{cta}</Link>
			</Button>
		</div>
	);
}
