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

  // Add CSP in both development and production
  // In development, we still need CSP for Google Maps and other external resources
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://*.googleapis.com https://*.gstatic.com",
      "script-src-elem 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://*.googleapis.com https://*.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://*.googleapis.com https://*.gstatic.com",
      "img-src 'self' data: https: https://*.googleapis.com https://*.gstatic.com",
      "font-src 'self' data: https://fonts.gstatic.com https://*.clerk.com https://*.clerk.accounts.dev",
      "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.paymob.com https://*.googleapis.com https://*.gstatic.com",
      "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
      "worker-src 'self' blob:",
    ].join("; ")
  );

  return response;
}

