import { NextResponse } from "next/server";
import { getCurrentUserReadOnly } from "@/lib/clerk";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUserReadOnly();

    if (!user) {
      return NextResponse.json(
        { user: null },
        {
          status: 401,
          headers: { "Cache-Control": "private, no-store, max-age=0" },
        }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      },
      {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch current user" },
      { status: 500 }
    );
  }
}
