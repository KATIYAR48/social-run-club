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

    // Get the current user ID from auth cookie
    const authCookie = request.cookies.get("cloka_auth");
    const currentUserId = authCookie?.value;

    let isFollowing = false;
    let isOwnProfile = false;

    if (currentUserId) {
      // Check if it's the user's own profile
      isOwnProfile = currentUserId === userId;

      // Check if the current user is following this user
      if (!isOwnProfile) {
        const followRelation = await Follow.findOne({
          followerId: currentUserId,
          followingId: userId,
        });
        isFollowing = !!followRelation;
      }
    }

    // Get follower and following counts
    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId }),
    ]);

    return NextResponse.json({
      success: true,
      isFollowing,
      isOwnProfile,
      isAuthenticated: !!currentUserId,
      stats: {
        followers: followerCount,
        following: followingCount,
      },
    });
  } catch (error) {
    console.error("Error getting follow status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
