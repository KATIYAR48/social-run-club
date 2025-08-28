import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Banner from "@/models/Banner";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Authenticate and check super admin
    const authCookie = request.cookies.get("cloka_auth");
    if (!authCookie || !authCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(authCookie.value);
    if (!user || user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Access denied. Super admin required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      content,
      isActive,
      backgroundColor,
      textColor,
      buttonText,
      buttonLink,
    } = body;

    // Validate required fields
    if (!content || !buttonText || !buttonLink) {
      return NextResponse.json(
        { error: "Content, button text, and button link are required" },
        { status: 400 }
      );
    }

    // Deactivate all existing banners first
    await Banner.updateMany({}, { isActive: false });

    // Create new banner (this replaces the old one)
    const newBanner = new Banner({
      content,
      isActive,
      backgroundColor: backgroundColor || "#000000",
      textColor: textColor || "#ffffff",
      buttonText,
      buttonLink,
      updatedBy: user.email,
      updatedAt: new Date(),
    });

    await newBanner.save();

    return NextResponse.json({
      message: "Banner updated successfully",
      banner: newBanner,
    });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    );
  }
}
