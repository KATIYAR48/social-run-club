import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    // Connect to the database
    await dbConnect();

    const params = await context.params;
    const eventId = params.id;

    // Find the event by ID
    const event = await Event.findById(eventId);

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching event:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    // Connect to the database
    await dbConnect();

    const params = await context.params;
    const eventId = params.id;

    const body = await request.json();
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
    } = body;

    // Validate required fields
    if (!title || !description || !date || !location) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find and update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
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
      },
      { new: true } // Return the updated document
    );

    if (!updatedEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Event updated successfully",
        event: updatedEvent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating event:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    // Connect to the database
    await dbConnect();

    const params = await context.params;
    const eventId = params.id;

    // Find and delete the event
    const deletedEvent = await Event.findByIdAndDelete(eventId);

    if (!deletedEvent) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Event deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting event:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete event" },
      { status: 500 }
    );
  }
}
