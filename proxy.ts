import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSafeCallbackUrl } from "@/helpers/authRedirect";

// An array of routes that are not accessible to the public
export const adminRoutes = ["/admin", "/admin/*"];

export const protectedRoutes = ["/profile"];

// An array of routes that are used for authentication. `/signup` is handled by
// the `(auth)` layout instead, which routes admins to their own landing page.
// The client-side `authFlowRoutes` in `helpers/authRedirect.ts` covers the same
// ground plus `/signup`, since none of them may be a login callback target.
export const authRoutes = [
	"/login",
	"/reset-password",
	"/new-password",
	"/auth/error",
];

// The prefix for API routes
// Routes that start with this prefix are used for API purposes
export const apiPrefix = "/api";

const apiCorsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Authorization, Content-Type, X-Requested-With, Accept, Origin",
};

// The default redirect path after logging in
export const DEFAULT_LOGIN_REDIRECT = "/profile";

const checkAdminRoute = (pathname: string) => {
	return adminRoutes.some((route) => {
		if (route.endsWith("*")) {
			return pathname.startsWith(route.slice(0, -1));
		}
		return pathname === route;
	});
};

export async function proxy(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	const { nextUrl } = request;
	const isLoggedIn = !!session;

	const isApiRoute = nextUrl.pathname.startsWith(apiPrefix);
	const isAuthRoute = authRoutes.includes(nextUrl.pathname);
	const isProtectedRoute = protectedRoutes.includes(nextUrl.pathname);
	const isAdminRoute = checkAdminRoute(nextUrl.pathname);

	if (isApiRoute) {
		if (request.method === "OPTIONS") {
			return new NextResponse(null, {
				status: 204,
				headers: apiCorsHeaders,
			});
		}

		// Always skip auth for API routes
		return;
	}

	if (isAuthRoute) {
		if (isLoggedIn) {
			// Already logged in on an auth page — usually a back navigation after
			// signing in. Honour the callback so the user still ends up where they
			// were headed, rather than on the default landing page.
			const callbackUrl = nextUrl.searchParams.get("callbackUrl");
			const target =
				callbackUrl && isSafeCallbackUrl(callbackUrl)
					? callbackUrl
					: DEFAULT_LOGIN_REDIRECT;
			return Response.redirect(new URL(target, nextUrl));
		}
		return;
	}

	if (!isLoggedIn && (isProtectedRoute || isAdminRoute)) {
		let callbackUrl = nextUrl.pathname;
		if (nextUrl.search) {
			callbackUrl += nextUrl.search;
		}
		const encodedCallbackUrl = encodeURIComponent(callbackUrl);
		return Response.redirect(
			new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl),
		);
	}
}

export const config = {
	matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"], // Specify the routes the proxy applies to
};
