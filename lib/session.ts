import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/auth";

export const getSessionUser = cache(async () => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) {
		return undefined;
	}
	return session.user;
});
