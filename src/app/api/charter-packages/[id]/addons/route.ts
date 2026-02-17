import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { charterPackageAddonSchema } from "@/lib/validations/charter-package";
import { requireAdmin } from "@/lib/clerk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const addons = await prisma.charterPackageAddon.findMany({
      where: { packageId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(addons);
  } catch (error) {
    console.error("Error fetching addons:", error);
    return NextResponse.json(
      { error: "Failed to fetch addons" },
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
    const data = charterPackageAddonSchema.parse(body);

    const addon = await prisma.charterPackageAddon.create({
      data: {
        ...data,
        packageId: id,
      },
    });

    return NextResponse.json(addon, { status: 201 });
  } catch (error: any) {
    console.error("Error creating addon:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create addon" },
      { status: 500 }
    );
  }
}

