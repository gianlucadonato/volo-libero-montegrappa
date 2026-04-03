import { NEXT_YEAR } from "@/config/constants";
import type { UserWithMemberships } from "@/types";

export function isSocio(user: UserWithMemberships) {
	return (
		user.role === "ADMIN" ||
		(user.memberships.length > 0 &&
			user.memberships.some((membership) => membership.year === NEXT_YEAR))
	);
}
