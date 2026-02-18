import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/clerk";
import { branchService } from "@/services/branches/branchService";
import { branchSchema } from "@/lib/validations/branch";
import { logActivity, ActivityActions } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/branches/[id]
 * Get single branch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const branch = await branchService.getBranchById(id);

    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(branch);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch branch", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/branches/[id]
 * Update branch
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Partial validation - only validate provided fields
    const validationResult = branchSchema.partial().safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const branch = await branchService.updateBranch(id, validationResult.data);

    await logActivity({
      userId: admin.id,
      action: ActivityActions.BRANCH_UPDATED,
      entityType: "Branch",
      entityId: id,
      details: { changes: Object.keys(body) },
    });

    return NextResponse.json(branch);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Branch not found" },
          { status: 404 }
        );
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Branch with this slug already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update branch", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/branches/[id]
 * Delete branch
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const branch = await branchService.getBranchById(id);
    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    await branchService.deleteBranch(id);

    await logActivity({
      userId: admin.id,
      action: ActivityActions.BRANCH_DELETED,
      entityType: "Branch",
      entityId: id,
      details: { name: branch.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete branch", details: err.message },
      { status: 500 }
    );
  }
}


