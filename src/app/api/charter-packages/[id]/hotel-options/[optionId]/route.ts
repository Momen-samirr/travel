import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { charterPackageHotelOptionSchema } from "@/lib/validations/charter-package";
import { requireAdmin } from "@/lib/clerk";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    await requireAdmin();
    const { optionId } = await params;
    const body = await request.json();
    const data = charterPackageHotelOptionSchema.parse(body);

    const option = await prisma.charterPackageHotelOption.update({
      where: { id: optionId },
      data,
      include: {
        hotel: true,
      },
    });

    return NextResponse.json(option);
  } catch (error: any) {
    console.error("Error updating hotel option:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update hotel option" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    await requireAdmin();
    const { optionId } = await params;
    await prisma.charterPackageHotelOption.delete({
      where: { id: optionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hotel option:", error);
    return NextResponse.json(
      { error: "Failed to delete hotel option" },
      { status: 500 }
    );
  }
}

