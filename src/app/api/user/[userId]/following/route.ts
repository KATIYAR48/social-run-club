import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Follow from "@/models/Follow";
import User from "@/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await dbConnect();

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get following (users this user follows)
    const following = await Follow.find({ followerId: userId })
      .populate("followingId", "username name _id")
      .sort({ createdAt: -1 })
      .lean();

    // Get following count
    const followingCount = following.length;

    // Format the response
    const followingList = following.map((follow) => ({
      _id: follow.followingId._id,
      username: follow.followingId.username,
      name: follow.followingId.name,
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      success: true,
      following: followingList,
      count: followingCount,
    });
  } catch (error) {
    console.error("Error getting following:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
