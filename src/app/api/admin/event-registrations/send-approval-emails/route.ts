import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserEvent from "@/models/UserEvent";
import Event from "@/models/Event";
import User from "@/models/User";
import { emailService } from "@/lib/email-service";
import { EmailTemplates } from "@/lib/email-templates";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Authenticate and check admin
    const authCookie = request.cookies.get("cloka_auth");
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminUser = await User.findById(authCookie.value).maxTimeMS(5000);
    if (
      !adminUser ||
      (adminUser.role !== "admin" && adminUser.role !== "super-admin")
    ) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Check if email service is configured
    if (!emailService.isEmailConfigured()) {
      return NextResponse.json(
        { success: false, message: "Email service not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { eventId, customMessage } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    // Get all approved registrations for this event
    const approvedRegistrations = await UserEvent.aggregate([
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(eventId),
          approved: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
          },
        },
      },
    ]);

    if (approvedRegistrations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No approved registrations found for this event",
        },
        { status: 404 }
      );
    }

    // Prepare email content - Convert to IST timezone
    const eventDate = new Date(event.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata", // IST timezone
    });

    const eventTime =
      new Date(event.date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata", // IST timezone
      }) + " IST";

    const approvalMessage =
      customMessage ||
      event.postApprovalMessage ||
      `Congratulations! Your registration for "${event.title}" has been approved. We're excited to have you join us for this amazing event.`;

    // Send emails with rate limiting (14 emails per second)
    const emailsPerSecond = 14;
    const delayBetweenBatches = 1000; // 1 second
    const emailsPerBatch = emailsPerSecond;

    const results = {
      total: approvedRegistrations.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process emails in batches
    for (let i = 0; i < approvedRegistrations.length; i += emailsPerBatch) {
      const batch = approvedRegistrations.slice(i, i + emailsPerBatch);

      // Send emails in parallel for this batch
      const batchPromises = batch.map(async (registration) => {
        try {
          const emailTemplate = EmailTemplates.eventApproval({
            userName: registration.user.name,
            eventTitle: event.title,
            eventDate,
            eventTime,
            eventLocation: event.location,
            eventDescription: event.description,
            approvalMessage,
            eventId: event._id.toString(),
          });

          await emailService.sendEmail({
            to: registration.user.email,
            from: process.env.SES_FROM_EMAIL || "admin@cloka.in",
            ...emailTemplate,
          });

          return { success: true, email: registration.user.email };
        } catch (error) {
          console.error(
            `Failed to send email to ${registration.user.email}:`,
            error
          );
          return {
            success: false,
            email: registration.user.email,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      // Wait for all emails in this batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Process results
      batchResults.forEach((result) => {
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${result.email}: ${result.error}`);
        }
      });

      // Add delay between batches (except for the last batch)
      if (i + emailsPerBatch < approvedRegistrations.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenBatches)
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Approval emails sent successfully`,
      results,
    });
  } catch (error) {
    console.error("Error sending approval emails:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send approval emails" },
      { status: 500 }
    );
  }
}
