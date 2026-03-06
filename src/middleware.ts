import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { addSecurityHeaders } from "./lib/security-headers";

const isProtectedPageRoute = createRouteMatcher([
  "/admin(.*)",
  "/bookings(.*)",
  "/complaints(.*)",
]);

const isProtectedApiRoute = createRouteMatcher([
  "/api/admin(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  let response: NextResponse;
  const requiresAuth =
    isProtectedPageRoute(request) || isProtectedApiRoute(request);

  if (requiresAuth) {
    const { userId } = await auth();

    if (!userId) {
      if (isProtectedApiRoute(request)) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Redirect to sign-in with return URL for protected pages
      const signInUrl = new URL("/sign-in", request.url);
      const returnPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
      signInUrl.searchParams.set("redirect", returnPath);

      return NextResponse.redirect(signInUrl);
    }
  }

  response = NextResponse.next();
  return addSecurityHeaders(response);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

