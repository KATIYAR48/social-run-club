import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { NotificationHistory } from "@/models/Notification";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { trackingId } = body;

    if (!trackingId) {
      return NextResponse.json(
        { success: false, message: "Tracking ID required" },
        { status: 400 }
      );
    }

    // Find and update the notification history to track close event
    const notification = await NotificationHistory.findById(trackingId);

    if (notification) {
      // Could add close tracking metrics here if needed
      console.log(`Notification ${trackingId} was closed by user`);
    }

    return NextResponse.json({
      success: true,
      message: "Close event tracked",
    });
  } catch (error) {
    console.error("Error tracking notification close:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
