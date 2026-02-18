import { NextRequest, NextResponse } from "next/server";
import { branchService } from "@/services/branches/branchService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/branches
 * Returns all active branches ordered by displayOrder
 */
export async function GET(request: NextRequest) {
  try {
    const branches = await branchService.getAllBranches();

    return NextResponse.json({
      branches,
      total: branches.length,
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    const err = error instanceof Error ? error : new Error(String(error));

    return NextResponse.json(
      {
        error: "Failed to fetch branches",
        details: err.message,
      },
      { status: 500 }
    );
  }
}


