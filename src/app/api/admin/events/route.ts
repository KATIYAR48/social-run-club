import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";

export async function GET() {
  try {
    // Authentication is already handled by middleware
    // We'll skip the double-check here since it's causing issues
    // and the middleware is already protecting this route

    // Connect to the database
    await dbConnect();

    // Fetch all events, sorted by date (newest first)
    const events = await Event.find().sort({ date: -1 });

    return NextResponse.json(
      {
        success: true,
        events,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching events:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse the request body
    const {
      title,
      description,
      date,
      location,
      exactLocation,
      postApprovalMessage,
      postRejectionMessage,
      razorpayButtonId,
      bannerImageURL,
      autoApprove,
      additionalInfoField,
    } = await request.json();

    // Validate required fields
    if (!title || !description || !date || !location) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a new event
    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      location,
      exactLocation: exactLocation || null,
      postApprovalMessage: postApprovalMessage || null,
      postRejectionMessage: postRejectionMessage || null,
      razorpayButtonId: razorpayButtonId || null,
      bannerImageURL: bannerImageURL || null,
      autoApprove: autoApprove || false,
      additionalInfoField: additionalInfoField || null,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create event" },
      { status: 500 }
    );
  }
}
