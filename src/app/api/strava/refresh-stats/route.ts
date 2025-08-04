import { NextRequest, NextResponse } from "next/server";
import { fetchAndUpdateStravaStats } from "../../../../lib/strava";
import dbConnect from "../../../../lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID required" },
        { status: 400 }
      );
    }

    await dbConnect();
    await fetchAndUpdateStravaStats(userId);

    return NextResponse.json({ message: "Stats updated successfully" });
  } catch (error) {
    console.error("Error refreshing stats:", error);
    return NextResponse.json(
      { message: "Failed to refresh stats" },
      { status: 500 }
    );
  }
}
