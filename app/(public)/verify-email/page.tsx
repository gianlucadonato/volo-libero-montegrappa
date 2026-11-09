import { redirect } from "next/navigation";
import VerifyEmail, {
	type VerifyEmailVariant,
} from "@/components/auth/VerifyEmail";
import { constructMetadata } from "@/config/site";
import { isSafeCallbackUrl } from "@/helpers/authRedirect";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
	title: "Verifica email",
	description: "Conferma il tuo indirizzo email",
});

/**
 * Three ways in: right after signing up (or trying to log in unverified), with
 * `email` and `sent` in the query; back from the link in the email, where better-auth has
 * already verified the address and logged the user in — or appended `error`
 * when the link was bad; and from the protected layout, for a session that
 * predates the verification requirement.
 *
 * Kept outside the `(auth)` group on purpose: that layout bounces logged-in
 * users, and an unverified session must be able to land here.
 */
export default async function VerifyEmailPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const param = (key: string) =>
		typeof params[key] === "string" ? params[key] : undefined;

	const requested = param("callbackUrl");
	const callbackUrl =
		requested && isSafeCallbackUrl(requested) ? requested : undefined;

	const user = await getSessionUser();
	if (user?.emailVerified) {
		// The onboarding gates take it from here: an incomplete profile is sent
		// on to the profile form, then back to `callbackUrl`.
		redirect(callbackUrl ?? "/profile");
	}

	// `sent` is set by the signup and login forms, right after better-auth
	// mailed the link. A logged-in visitor was sent here by a page gate, which
	// mails nothing, so they always have to ask for the link themselves.
	const sent = param("sent");
	const variant: VerifyEmailVariant = param("error")
		? "error"
		: !user && (sent === "signup" || sent === "login")
			? sent
			: "request";

	return (
		<div className="container mx-auto flex min-h-[70vh] w-full flex-col items-center justify-center py-10">
			<VerifyEmail
				email={user?.email ?? param("email")}
				variant={variant}
				isLoggedIn={Boolean(user)}
				callbackUrl={callbackUrl}
			/>
		</div>
	);
}
