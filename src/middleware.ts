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
    await auth.protect();
  }

  // Note: User creation is handled in getCurrentUser() which is called
  // in page components and API routes (not in middleware due to Edge Runtime)
  
  // For admin routes, we'll check the role in the admin layout instead
  // since we can't use Prisma in middleware (Edge Runtime limitation)

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

