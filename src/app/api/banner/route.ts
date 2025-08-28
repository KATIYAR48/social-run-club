import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Banner from "@/models/Banner";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get the most recent active banner
    const banner = await Banner.findOne({ isActive: true })
      .sort({ updatedAt: -1 })
      .select("-__v")
      .lean();

    if (!banner) {
      return NextResponse.json({ banner: null });
    }

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return NextResponse.json(
      { error: "Failed to fetch banner" },
      { status: 500 }
    );
  }
}
