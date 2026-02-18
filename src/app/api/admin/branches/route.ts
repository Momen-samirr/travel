import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/clerk";
import { branchService } from "@/services/branches/branchService";
import { branchSchema } from "@/lib/validations/branch";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/branches
 * List all branches (with pagination)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const isActive = searchParams.get("isActive");

    const branches = await branchService.getAllBranchesAdmin();

    // Filter by isActive if provided
    let filteredBranches = branches;
    if (isActive !== null && isActive !== undefined) {
      filteredBranches = branches.filter(
        (branch) => branch.isActive === (isActive === "true")
      );
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedBranches = filteredBranches.slice(skip, skip + limit);
    const total = filteredBranches.length;

    return NextResponse.json({
      branches: paginatedBranches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch branches", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/branches
 * Create a new branch
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const validationResult = branchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const branch = await branchService.createBranch(validationResult.data);

    await logActivity({
      userId: admin.id,
      action: ActivityActions.BRANCH_CREATED,
      entityType: "Branch",
      entityId: branch.id,
      details: { name: branch.name, city: branch.city },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Branch with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create branch", details: err.message },
      { status: 500 }
    );
  }
}


