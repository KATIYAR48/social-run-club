import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Get the auth cookie
    const authCookie = request.cookies.get("cloka_auth");

    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Find the user by ID
    const user = await User.findById(authCookie.value);

    if (!user) {
      // Clear the invalid cookie
      const response = NextResponse.json(
        { success: false, message: "User not found" },
        { status: 401 }
      );

      response.cookies.set({
        name: "cloka_auth",
        value: "",
        httpOnly: true,
        expires: new Date(0),
        path: "/",
      });

      return response;
    }

    // Return user data (excluding sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        emergencyContact: user.emergencyContact,
        instagramUsername: user.instagramUsername,
        joinCrew: user.joinCrew,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 }
    );
  }
}
