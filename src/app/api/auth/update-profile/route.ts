import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const {
      name,
      username,
      phone,
      dateOfBirth,
      gender,
      emergencyContact,
      instagramUsername,
      newPassword,
      currentPassword,
    } = body;

    // Find the user by ID
    const user = await User.findById(authCookie.value);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Validate and check username if provided
    if (username && username !== user.username) {
      // Validate username format
      const usernameRegex = /^[a-z0-9_-]+$/;
      const cleanUsername = username.toLowerCase().trim();

      if (
        !usernameRegex.test(cleanUsername) ||
        cleanUsername.length < 3 ||
        cleanUsername.length > 30
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Username must be 3-30 characters and contain only letters, numbers, underscores, and dashes",
          },
          { status: 400 }
        );
      }

      // Check if username is already taken by another user
      const existingUserByUsername = await User.findOne({
        username: cleanUsername,
        _id: { $ne: user._id }, // Exclude current user
      });

      if (existingUserByUsername) {
        return NextResponse.json(
          { success: false, message: "Username already taken" },
          { status: 400 }
        );
      }

      user.username = cleanUsername;
    }

    // Update user fields
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : user.dateOfBirth;
    user.gender = gender || user.gender;
    user.emergencyContact =
      emergencyContact !== undefined ? emergencyContact : user.emergencyContact;
    user.instagramUsername =
      instagramUsername !== undefined
        ? instagramUsername
        : user.instagramUsername;
    user.updatedAt = new Date();

    // Update password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          {
            success: false,
            message: "New password must be at least 6 characters",
          },
          { status: 400 }
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    // Save the updated user
    await user.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while updating profile" },
      { status: 500 }
    );
  }
}
