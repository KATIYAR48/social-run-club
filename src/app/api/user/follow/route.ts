import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Follow from "@/models/Follow";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get the auth cookie
    const authCookie = request.cookies.get("cloka_auth");

    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const followerId = authCookie.value;
    const { userId: followingId, action } = await request.json();

    if (!followingId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    if (!action || !["follow", "unfollow"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action must be 'follow' or 'unfollow'" },
        { status: 400 }
      );
    }

    // Verify both users exist
    const [followerUser, followingUser] = await Promise.all([
      User.findById(followerId),
      User.findById(followingId),
    ]);

    if (!followerUser) {
      return NextResponse.json(
        { success: false, message: "Follower user not found" },
        { status: 404 }
      );
    }

    if (!followingUser) {
      return NextResponse.json(
        { success: false, message: "User to follow not found" },
        { status: 404 }
      );
    }

    // Prevent users from following themselves
    if (followerId === followingId) {
      return NextResponse.json(
        { success: false, message: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    if (action === "follow") {
      // Check if already following
      const existingFollow = await Follow.findOne({
        followerId,
        followingId,
      });

      if (existingFollow) {
        return NextResponse.json(
          { success: false, message: "Already following this user" },
          { status: 400 }
        );
      }

      // Create new follow relationship
      const newFollow = new Follow({
        followerId,
        followingId,
      });

      await newFollow.save();

      return NextResponse.json({
        success: true,
        message: "Successfully followed user",
        action: "followed",
      });
    } else if (action === "unfollow") {
      // Find and delete the follow relationship
      const followToDelete = await Follow.findOneAndDelete({
        followerId,
        followingId,
      });

      if (!followToDelete) {
        return NextResponse.json(
          { success: false, message: "Not following this user" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Successfully unfollowed user",
        action: "unfollowed",
      });
    }
  } catch (error) {
    console.error("Error in follow/unfollow:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
