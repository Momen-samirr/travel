import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/clerk";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const imageUrl = await uploadImage(file);

    return NextResponse.json({ url: imageUrl });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    if (error.message === "Forbidden: Admin access required") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

