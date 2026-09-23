import { prisma } from "@/lib/prisma";
import { seasonRange } from "@/lib/season";

export type AdminYearStats = {
	/** Accounts that existed during the season, plus that season's members. */
	users: number;
	/** People holding a membership for the season. */
	members: number;
	nonMembers: number;
	male: number;
	female: number;
};

/**
 * The headline counts for one season.
 *
 * Membership drives all of this, not the `MEMBER` role: the role is a flag for
 * whoever is a member *now*, so it says nothing about any particular year.
 * `user_membership` holds one row per product sold, and people commonly buy
 * two, so the rows are de-duplicated by user — 2025 has 603 rows for 308 people.
 *
 * "Users" counts the accounts that existed while the season was running, rather
 * than every account ever created. Counting all of them would report people as
 * non-members of a season they could not have joined, because they only signed
 * up afterwards. Members are added back in regardless of when their account was
 * created, so nobody who actually paid is dropped from the total they belong to.
 */
export default async function getAdminYearStats(
	year: number,
): Promise<AdminYearStats> {
	const { end } = seasonRange(year);

	const memberships = await prisma.userMembership.findMany({
		where: { year },
		distinct: ["userId"],
		select: { user: { select: { id: true, gender: true, deletedAt: true } } },
	});
	const members = memberships
		.map(({ user }) => user)
		.filter((u) => !u.deletedAt);
	const memberIds = members.map((user) => user.id);

	const users = await prisma.user.count({
		where: {
			deletedAt: null,
			OR: [{ createdAt: { lt: end } }, { id: { in: memberIds } }],
		},
	});

	return {
		users,
		members: members.length,
		nonMembers: users - members.length,
		male: members.filter((user) => user.gender === "M").length,
		female: members.filter((user) => user.gender === "F").length,
	};
}
