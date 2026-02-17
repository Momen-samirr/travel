import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { charterPackageHotelOptionSchema } from "@/lib/validations/charter-package";
import { requireAdmin } from "@/lib/clerk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const options = await prisma.charterPackageHotelOption.findMany({
      where: { packageId: id },
      include: {
        hotel: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("Error fetching hotel options:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotel options" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = charterPackageHotelOptionSchema.parse(body);

    const option = await prisma.charterPackageHotelOption.create({
      data: {
        ...data,
        packageId: id,
      },
      include: {
        hotel: true,
      },
    });

    return NextResponse.json(option, { status: 201 });
  } catch (error: any) {
    console.error("Error creating hotel option:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create hotel option" },
      { status: 500 }
    );
  }
}

