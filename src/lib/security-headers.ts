import { NextResponse } from "next/server";

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Note: X-Frame-Options is handled by CSP frame-src directive
  // Setting to SAMEORIGIN to allow Clerk iframes while maintaining security
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Only add strict CSP in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev",
        "script-src-elem 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev",
        "style-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://*.clerk.com https://*.clerk.accounts.dev",
        "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.amadeus.com https://*.paymob.com",
        "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
        "worker-src 'self' blob:",
      ].join("; ")
    );
  }

  return response;
}

