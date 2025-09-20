import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import mongoose from "mongoose";

// Define no-cache headers
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: Request) {
  try {
    // Connect to the database
    await dbConnect();

    // Get the URL and check for query parameters
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";
    const eventId = searchParams.get("id");

    // If an ID is provided, fetch a single event
    if (eventId) {
      // Validate that the ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return NextResponse.json(
          { success: false, message: "Invalid event ID format" },
          {
            status: 400,
            headers: NO_CACHE_HEADERS,
          }
        );
      }

      const event = await Event.findById(eventId);

      if (!event) {
        return NextResponse.json(
          { success: false, message: "Event not found" },
          {
            status: 404,
            headers: NO_CACHE_HEADERS,
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          event,
        },
        {
          status: 200,
          headers: NO_CACHE_HEADERS,
        }
      );
    }

    // Otherwise, fetch multiple events
    let events;

    if (showAll) {
      // Fetch all events
      events = await Event.find({}).sort({ date: -1 });
    } else {
      // Fetch upcoming events (events with date >= today)
      events = await Event.find({
        date: { $gte: new Date() },
      }).sort({ date: 1 });
    }

    return NextResponse.json(
      {
        success: true,
        events,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error("Error fetching events:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch events" },
      {
        status: 500,
        headers: NO_CACHE_HEADERS,
      }
    );
  }
}
