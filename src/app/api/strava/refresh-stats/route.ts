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

    // Handle specific Strava errors
    if (error instanceof Error) {
      if (error.message.includes("quota exceeded")) {
        return NextResponse.json(
          {
            message:
              "Strava quota exceeded. Please contact support for quota increase.",
          },
          { status: 403 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { message: "Strava rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to refresh stats" },
      { status: 500 }
    );
  }
}
