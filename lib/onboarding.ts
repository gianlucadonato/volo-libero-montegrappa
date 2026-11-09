import "server-only";

import Boom from "@hapi/boom";
import { redirect } from "next/navigation";
import { withCallbackUrl } from "@/helpers/authRedirect";
import {
	ONBOARDING_ERRORS,
	ONBOARDING_SELECT,
	type OnboardingStatus,
	onboardingRedirect,
	onboardingStatus,
} from "@/helpers/onboarding";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function getOnboardingStatus(
	userId: string,
): Promise<OnboardingStatus | null> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: ONBOARDING_SELECT,
	});
	return user ? onboardingStatus(user) : null;
}

/**
 * For pages: lets through only a logged-in user who verified the email and
 * completed the profile, and sends anyone else to the step they are missing,
 * coming back to `callbackUrl` afterwards.
 */
export async function requireOnboardedUser(callbackUrl?: string) {
	const user = await getSessionUser();
	if (!user) redirect(withCallbackUrl("/login", callbackUrl));
	const status = await getOnboardingStatus(user.id);
	if (status !== "complete") {
		redirect(onboardingRedirect(status ?? "unverified", callbackUrl));
	}
	return user;
}

/**
 * For API routes and server actions: throws a 403 carrying the missing step
 * when the user may not act yet. A session alone is not enough — accounts
 * created before verification was required still have live sessions.
 */
export async function assertOnboarded(userId: string) {
	const status = await getOnboardingStatus(userId);
	if (status === "complete") return;
	throw Boom.forbidden(ONBOARDING_ERRORS[status ?? "unverified"]);
}
