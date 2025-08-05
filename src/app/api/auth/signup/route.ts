import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// Function to generate username from email
function generateUsernameFromEmail(email: string): string {
  // Extract the part before @ symbol
  const emailPrefix = email.split("@")[0];

  // Replace dots with underscores, remove special characters
  let username = emailPrefix
    .toLowerCase()
    .replace(/\./g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .trim();

  // Ensure minimum length
  if (username.length < 3) {
    username = username + "_user";
  }

  // Ensure maximum length
  if (username.length > 30) {
    username = username.substring(0, 30);
  }

  return username;
}

// Function to find available username (handle duplicates)
async function findAvailableUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return username;
    }

    // If username exists, append a number
    const suffix = `_${counter}`;
    if (baseUsername.length + suffix.length > 30) {
      // Truncate base username to fit the suffix
      const maxBaseLength = 30 - suffix.length;
      username = baseUsername.substring(0, maxBaseLength) + suffix;
    } else {
      username = baseUsername + suffix;
    }

    counter++;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      emergencyContact,
      instagramUsername,
      joinCrew,
      username: providedUsername, // Allow users to provide their own username
    } = body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { success: false, message: "Required fields are missing" },
        { status: 400 }
      );
    }

    // Check if user already exists with the same email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if user already exists with the same phone number
    const existingUserByPhone = await User.findOne({ phone });
    if (existingUserByPhone) {
      return NextResponse.json(
        { success: false, message: "Phone number already registered" },
        { status: 400 }
      );
    }

    // Check if user already exists with the same Instagram username (if provided)
    if (instagramUsername) {
      const existingUserByInstagram = await User.findOne({ instagramUsername });
      if (existingUserByInstagram) {
        return NextResponse.json(
          { success: false, message: "Instagram username already registered" },
          { status: 400 }
        );
      }
    }

    // Generate or validate username
    let finalUsername: string;

    if (providedUsername) {
      // Validate provided username format
      const usernameRegex = /^[a-z0-9_-]+$/;
      const cleanUsername = providedUsername.toLowerCase().trim();

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

      // Check if provided username is already taken
      const existingUserByUsername = await User.findOne({
        username: cleanUsername,
      });
      if (existingUserByUsername) {
        return NextResponse.json(
          { success: false, message: "Username already taken" },
          { status: 400 }
        );
      }

      finalUsername = cleanUsername;
    } else {
      // Generate username from email
      const baseUsername = generateUsernameFromEmail(email);
      finalUsername = await findAvailableUsername(baseUsername);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      username: finalUsername,
      password: hashedPassword,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      emergencyContact,
      instagramUsername,
      joinCrew: joinCrew === true,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create a session cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      },
      { status: 201 }
    );

    // Set the auth cookie
    response.cookies.set({
      name: "cloka_auth",
      value: user._id.toString(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error during signup:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
