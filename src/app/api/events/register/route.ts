import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserEvent from "@/models/UserEvent";
import User from "@/models/User";
import Event from "@/models/Event";

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

    const userId = authCookie.value;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get request body
    const body = await request.json();
    const { eventId, additionalInfo } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event is in the past
    if (new Date(event.date) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This event has already taken place and is no longer open for registration.",
        },
        { status: 400 }
      );
    }

    // Check if user is already registered for this event
    const existingRegistration = await UserEvent.findOne({
      userId,
      eventId,
    });

    if (existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          message: "You are already registered for this event",
        },
        { status: 400 }
      );
    }

    // Create new registration
    const userEvent = await UserEvent.create({
      userId,
      eventId,
      approved: event.autoApprove ? true : null, // Auto-approve if enabled, otherwise pending
      createdAt: new Date(),
      additionalInfo: additionalInfo || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Successfully registered for event",
        userEvent: {
          _id: userEvent._id,
          eventId: userEvent.eventId,
          approved: userEvent.approved,
          createdAt: userEvent.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
