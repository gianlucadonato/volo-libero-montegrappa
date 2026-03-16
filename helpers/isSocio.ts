import type { UserWithMemberships } from "@/types";

export function isSocio(user: UserWithMemberships) {
	return user.role === "ADMIN" || user.memberships.length > 0;
}
