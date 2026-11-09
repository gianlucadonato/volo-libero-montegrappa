import { withCallbackUrl } from "@/helpers/authRedirect";
import { UserFormSchema } from "@/schemas";

/**
 * Where a user stands in the signup flow:
 * - `unverified`: has not clicked the link in the verification email yet;
 * - `incomplete`: verified, but the profile still misses required data;
 * - `complete`: may use the member area, buy a membership, enroll in XC.
 *
 * Client-safe on purpose: the admin users table computes it in the browser.
 */
export type OnboardingStatus = "unverified" | "incomplete" | "complete";

/**
 * The fields the profile form marks as required. Picked from the form schema
 * itself, so making a field mandatory there makes it mandatory here too.
 */
const RequiredProfileSchema = UserFormSchema.pick({
	firstName: true,
	lastName: true,
	dateOfBirth: true,
	placeOfBirth: true,
	streetAddress: true,
	city: true,
	zipCode: true,
	province: true,
	state: true,
	phone: true,
	fiscalCode: true,
	gender: true,
});

export const REQUIRED_PROFILE_FIELDS = Object.keys(
	RequiredProfileSchema.shape,
) as (keyof typeof RequiredProfileSchema.shape)[];

export type RequiredProfileFields = Record<
	(typeof REQUIRED_PROFILE_FIELDS)[number],
	string | null
>;

/** A Prisma `select` loading exactly what `onboardingStatus` reads. */
export const ONBOARDING_SELECT = {
	emailVerified: true,
	...Object.fromEntries(REQUIRED_PROFILE_FIELDS.map((key) => [key, true])),
} as { emailVerified: true } & Record<
	(typeof REQUIRED_PROFILE_FIELDS)[number],
	true
>;

export function isProfileComplete(user: RequiredProfileFields) {
	return RequiredProfileSchema.safeParse(user).success;
}

export function onboardingStatus(
	user: { emailVerified: boolean } & RequiredProfileFields,
): OnboardingStatus {
	if (!user.emailVerified) return "unverified";
	return isProfileComplete(user) ? "complete" : "incomplete";
}

/**
 * The error a 403 carries when the user is not done with the signup flow, so
 * clients can send them to the missing step.
 */
export const ONBOARDING_ERRORS = {
	unverified: "EMAIL_NOT_VERIFIED",
	incomplete: "PROFILE_INCOMPLETE",
} as const;

/** The page that completes a missing onboarding step. */
export function onboardingRedirect(
	status: Exclude<OnboardingStatus, "complete">,
	callbackUrl?: string,
) {
	return withCallbackUrl(
		status === "unverified" ? "/verify-email" : "/profile/edit",
		callbackUrl,
	);
}

/**
 * Maps an onboarding error returned by the API back to the page that fixes
 * it, or `null` for any other error.
 */
export function onboardingErrorRedirect(error: unknown, callbackUrl?: string) {
	if (error === ONBOARDING_ERRORS.unverified) {
		return onboardingRedirect("unverified", callbackUrl);
	}
	if (error === ONBOARDING_ERRORS.incomplete) {
		return onboardingRedirect("incomplete", callbackUrl);
	}
	return null;
}
