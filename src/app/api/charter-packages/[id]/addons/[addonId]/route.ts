import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { charterPackageAddonSchema } from "@/lib/validations/charter-package";
import { requireAdmin } from "@/lib/clerk";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  try {
    await requireAdmin();
    const { addonId } = await params;
    const body = await request.json();
    const data = charterPackageAddonSchema.parse(body);

    const addon = await prisma.charterPackageAddon.update({
      where: { id: addonId },
      data,
    });

    return NextResponse.json(addon);
  } catch (error: any) {
    console.error("Error updating addon:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update addon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addonId: string }> }
) {
  try {
    await requireAdmin();
    const { addonId } = await params;
    await prisma.charterPackageAddon.delete({
      where: { id: addonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting addon:", error);
    return NextResponse.json(
      { error: "Failed to delete addon" },
      { status: 500 }
    );
  }
}

