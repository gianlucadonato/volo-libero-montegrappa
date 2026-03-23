import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// An array of routes that are not accessible to the public
export const adminRoutes = ["/admin", "/admin/*"];

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
