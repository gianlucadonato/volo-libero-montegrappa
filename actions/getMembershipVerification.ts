import { isWithinInterval } from "date-fns";
import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";

const FLYCARD_DESCRIPTION = "Flycard Vivere il Grappa 2025";

export interface MembershipVerification {
	firstName: string;
	lastName: string;
	memberId: number;
	sinceYear: number;
	currentYear: number;
	isActive: boolean;
	years: number[];
}

/**
 * Public, minimal membership lookup used by the QR verification page
 * (`/verifica/[id]`). Exposes only non-sensitive data: name, member number,
 * enrolment years and whether the current-year card is active. Soft-deleted
 * users are excluded.
 */
export default async function getMembershipVerification(
	userId: string,
): Promise<MembershipVerification | null> {
	const user = await prisma.user.findFirst({
		where: { id: userId, deletedAt: null },
		select: {
			firstName: true,
			lastName: true,
			memberId: true,
			createdAt: true,
			memberships: {
				orderBy: { year: "desc" },
				select: {
					year: true,
					status: true,
					validFrom: true,
					validUntil: true,
					description: true,
				},
			},
		},
	});

	if (!user) return null;

	const memberships = user.memberships.filter(
		(m) => m.description !== FLYCARD_DESCRIPTION,
	);

	const current = memberships.find((m) => m.year === NEXT_YEAR);
	const isActive = current ? isMembershipActive(current) : false;

	const years = Array.from(new Set(memberships.map((m) => m.year))).sort(
		(a, b) => b - a,
	);

	return {
		firstName: user.firstName,
		lastName: user.lastName,
		memberId: user.memberId,
		sinceYear: user.createdAt.getFullYear(),
		currentYear: NEXT_YEAR,
		isActive,
		years,
	};
}

function isMembershipActive(membership: {
	status: string | null;
	validFrom: Date | null;
	validUntil: Date | null;
}): boolean {
	if (membership.validFrom && membership.validUntil) {
		return isWithinInterval(new Date(), {
			start: membership.validFrom,
			end: membership.validUntil,
		});
	}
	return membership.status === "active";
}
