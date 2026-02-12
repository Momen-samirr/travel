import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { maxRequests?: number; windowMs?: number } = {}
) {
  return async (req: NextRequest) => {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";
    const identifier = ip;

    const limit = rateLimit(identifier, options.maxRequests || 10, options.windowMs || 60000);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(options.maxRequests || 10),
            "X-RateLimit-Remaining": String(limit.remaining),
            "X-RateLimit-Reset": String(limit.resetTime),
            "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    const response = await handler(req);

    response.headers.set("X-RateLimit-Limit", String(options.maxRequests || 10));
    response.headers.set("X-RateLimit-Remaining", String(limit.remaining));
    response.headers.set("X-RateLimit-Reset", String(limit.resetTime));

    return response;
  };
}

