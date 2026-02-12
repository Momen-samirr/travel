import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { addSecurityHeaders } from "./lib/security-headers";

const isPublicRoute = createRouteMatcher([
  "/",
  "/tours(.*)",
  "/flights(.*)",
  "/hotels(.*)",
  "/visa(.*)",
  "/blogs(.*)",
  "/reviews(.*)",
  "/about",
  "/contact",
  "/api/webhooks(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  let response: NextResponse;

  if (!isPublicRoute(request)) {
    const { userId } = await auth();
    
    if (!userId) {
      // Redirect to sign-in with return URL
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", request.url);
      
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

