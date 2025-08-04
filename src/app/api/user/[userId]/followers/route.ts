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

    // Get followers (users who follow this user)
    const followers = await Follow.find({ followingId: userId })
      .populate("followerId", "username name _id")
      .sort({ createdAt: -1 })
      .lean();

    // Get follower count
    const followerCount = followers.length;

    // Format the response
    const followersList = followers.map((follow) => ({
      _id: follow.followerId._id,
      username: follow.followerId.username,
      name: follow.followerId.name,
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      success: true,
      followers: followersList,
      count: followerCount,
    });
  } catch (error) {
    console.error("Error getting followers:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
