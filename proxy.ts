import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// An array of routes that are not accessible to the public
export const adminRoutes = ["/admin", "/admin/*"];

// Routes restricted to authenticated ADMIN users only (Keystatic CMS).
// Covers both the UI page and its API handler.
export const keystaticRoutes = [
	"/keystatic",
	"/keystatic/*",
	"/api/keystatic/*",
];

export const protectedRoutes = ["/profile"];

// An array of routes that are used for authentication
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

const checkKeystaticRoute = (pathname: string) => {
	return keystaticRoutes.some((route) => {
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
	const isAdmin = session?.user?.role === "ADMIN";

	const isApiRoute = nextUrl.pathname.startsWith(apiPrefix);
	const isAuthRoute = authRoutes.includes(nextUrl.pathname);
	const isProtectedRoute = protectedRoutes.includes(nextUrl.pathname);
	const isAdminRoute = checkAdminRoute(nextUrl.pathname);
	const isKeystaticRoute = checkKeystaticRoute(nextUrl.pathname);

	// Gate Keystatic UI + API behind ADMIN role (checked before the
	// generic API short-circuit so /api/keystatic/* is also protected).
	if (isKeystaticRoute) {
		if (!isLoggedIn) {
			if (isApiRoute) {
				return new NextResponse("Unauthorized", { status: 401 });
			}
			const callbackUrl = encodeURIComponent(
				nextUrl.pathname + (nextUrl.search ?? ""),
			);
			return Response.redirect(
				new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl),
			);
		}
		if (!isAdmin) {
			if (isApiRoute) {
				return new NextResponse("Forbidden", { status: 403 });
			}
			return Response.redirect(new URL("/", nextUrl));
		}
		// Admin: allow through.
		return;
	}

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
			return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
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
