import { describe, expect, it } from "vitest";
import { NEXT_YEAR } from "@/config/constants";
import { isSocio } from "@/helpers/isSocio";
import type { UserWithMemberships } from "@/types";

/** A user carrying just the fields `isSocio` looks at. */
const user = (
	role: "USER" | "MEMBER" | "ADMIN",
	membershipYears: number[] = [],
) =>
	({
		role,
		memberships: membershipYears.map((year) => ({ year })),
	}) as UserWithMemberships;

describe("isSocio", () => {
	it("counts a user holding a membership for the current year", () => {
		expect(isSocio(user("USER", [NEXT_YEAR]))).toBe(true);
	});

	it("does not count a user with no membership at all", () => {
		expect(isSocio(user("USER"))).toBe(false);
	});

	it("drops a member who has not renewed", () => {
		// 76 users carry the MEMBER role from a past payment while holding no
		// membership for the current year. The role would call them members; the
		// rows are what decide.
		expect(isSocio(user("MEMBER", [NEXT_YEAR - 1]))).toBe(false);
	});

	it("ignores the role when the membership says otherwise", () => {
		// The role is written once and never cleared, so it can only disagree in
		// the direction of claiming too much. Membership decides either way.
		expect(isSocio(user("MEMBER"))).toBe(false);
		expect(isSocio(user("USER", [NEXT_YEAR]))).toBe(true);
	});

	it("does not make an admin a socio by virtue of being an admin", () => {
		// Being allowed to run the club is not the same as having paid to join
		// it. Gates that should let admins through say so themselves.
		expect(isSocio(user("ADMIN"))).toBe(false);
		expect(isSocio(user("ADMIN", [NEXT_YEAR]))).toBe(true);
	});

	it("treats a missing user as not a socio", () => {
		// Called with the result of a lookup that may find nothing.
		expect(isSocio(null)).toBe(false);
	});
});
