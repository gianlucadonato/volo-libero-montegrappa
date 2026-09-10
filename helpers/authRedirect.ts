/**
 * Routes that are part of the auth flow itself. `proxy.ts` and the `(auth)`
 * layout redirect logged-in visitors away from these, so none of them can be a
 * callback target either — logging in would bounce the user straight out again.
 * Kept in a client-safe module: `proxy.ts` pulls in the server-only `@/auth`.
 */
export const authFlowRoutes = [
	"/login",
	"/signup",
	"/reset-password",
	"/new-password",
	"/auth/error",
];

/**
 * Only same-origin, path-absolute URLs may be used as a callback: anything else
 * would turn the login page into an open redirect. `//evil.com` and `/\evil.com`
 * are protocol-relative in browsers despite the leading slash.
 */
export function isSafeCallbackUrl(callbackUrl: string) {
	return (
		callbackUrl.startsWith("/") &&
		!callbackUrl.startsWith("//") &&
		!callbackUrl.startsWith("/\\") &&
		!authFlowRoutes.includes(callbackUrl.split("?")[0])
	);
}

/**
 * Builds a `/login` (or `/signup`) href that comes back to where the user
 * already was. The auth forms read `callbackUrl` from the query string, so a
 * bare link would silently fall back to the profile page instead.
 */
export function withCallbackUrl(path: string, callbackUrl?: string | null) {
	if (!callbackUrl || !isSafeCallbackUrl(callbackUrl)) return path;
	return `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
