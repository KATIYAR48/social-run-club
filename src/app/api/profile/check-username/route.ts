import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    const body = await request.json();
    const { username, excludeUserId } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_-]+$/;
    const cleanUsername = username.toLowerCase().trim();

    if (
      !usernameRegex.test(cleanUsername) ||
      cleanUsername.length < 3 ||
      cleanUsername.length > 30
    ) {
      return NextResponse.json({
        success: false,
        available: false,
        message:
          "Username must be 3-30 characters and contain only letters, numbers, underscores, and dashes",
      });
    }

    // Check if username exists (excluding current user if provided)
    const query: any = { username: cleanUsername };
    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const existingUser = await User.findOne(query);

    if (existingUser) {
      return NextResponse.json({
        success: true,
        available: false,
        message: "Username is already taken",
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
      message: "Username is available",
    });
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while checking username" },
      { status: 500 }
    );
  }
}
