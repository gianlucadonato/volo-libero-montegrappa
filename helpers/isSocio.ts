import { NEXT_YEAR } from "@/config/constants";
import type { UserWithMemberships } from "@/types";

/**
 * Whether a user holds a club membership for the current year.
 *
 * The `user_membership` rows are the only thing consulted. The `MEMBER` role is
 * not: it is written when a payment lands and never cleared, so it goes on
 * claiming "member" for everyone who has ever paid — 76 of the 363 users
 * carrying it have not renewed for the current year. A role says what someone
 * is allowed to do; membership is a fact with a year on it, and only the rows
 * carry the year.
 *
 * `ADMIN` used to pass here regardless of membership, which folded a permission
 * into that fact and made every caller inherit the exception. Gates that should
 * let admins through now say so themselves — see `registerToEvent`.
 */
export function isSocio(user: UserWithMemberships | null) {
	if (!user) return false;
	return user.memberships.some((membership) => membership.year === NEXT_YEAR);
}
