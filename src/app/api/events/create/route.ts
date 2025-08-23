import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("cloka_auth");

    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = authCookie.value;

    // Check if user exists and is an admin
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { title, description, date, location } = body;

    if (!title || !description || !date || !location) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new event
    const newEvent = new Event({
      title,
      description,
      date: new Date(date),
      location,
      exactLocation: body.exactLocation || null,
      postApprovalMessage: body.postApprovalMessage || null,
      autoApprove: body.autoApprove || false,
      createdBy: userId,
    });

    // Save to database
    await newEvent.save();

    return NextResponse.json(
      {
        message: "Event created successfully",
        event: newEvent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
