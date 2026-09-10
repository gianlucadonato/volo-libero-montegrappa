"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { withCallbackUrl } from "@/helpers/authRedirect";

/**
 * `/login` and `/signup` hrefs that carry the current location as the callback,
 * so logging in from anywhere returns there instead of the profile page.
 */
export function useAuthHref() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const query = searchParams.toString();
	const current = query ? `${pathname}?${query}` : pathname;

	return {
		loginHref: withCallbackUrl("/login", current),
		signupHref: withCallbackUrl("/signup", current),
	};
}
