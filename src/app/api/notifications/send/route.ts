import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import {
  NotificationSubscription,
  NotificationHistory,
} from "@/models/Notification";
import User from "@/models/User";
import webpush from "web-push";

// Configure web-push with VAPID details
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@cloka.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check admin authentication
    const authCookie = request.cookies.get("cloka_auth");
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify admin user
    const admin = await User.findById(authCookie.value);
    if (!admin || (admin.role !== "admin" && admin.role !== "super-admin")) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, message, url, targetAudience = "all" } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "Title and message are required" },
        { status: 400 }
      );
    }

    // Create notification history record
    const notificationHistory = new NotificationHistory({
      title,
      message,
      url,
      sentBy: admin._id,
      sentTo: targetAudience,
      status: "sending",
    });

    await notificationHistory.save();

    // Build query for target audience
    let userQuery = {};
    if (targetAudience === "crew") {
      userQuery = { joinCrew: true };
    } else if (targetAudience === "non-crew") {
      userQuery = {
        $or: [{ joinCrew: false }, { joinCrew: { $exists: false } }],
      };
    } else if (Array.isArray(targetAudience)) {
      userQuery = { _id: { $in: targetAudience } };
    }
    // For "all", we don't filter users

    // Get target users
    const targetUsers =
      targetAudience === "all"
        ? await User.find({})
        : await User.find(userQuery);

    const targetUserIds = targetUsers.map((user) => user._id);

    // Get active subscriptions for target users
    const subscriptions = await NotificationSubscription.find({
      userId: { $in: targetUserIds },
      isActive: true,
    });

    const payload = JSON.stringify({
      title,
      message,
      url: url || "/",
      icon: "/android-chrome-192x192.png",
      badge: "/android-chrome-192x192.png",
      tag: "cloka-notification",
      requireInteraction: false,
      data: {
        url: url || "/",
        trackingId: notificationHistory._id.toString(),
      },
    });

    // Send notifications
    let successCount = 0;
    let failureCount = 0;
    const errorLog: string[] = [];

    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          payload
        );
        successCount++;
      } catch (error) {
        failureCount++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errorLog.push(`Subscription ${subscription.endpoint}: ${errorMessage}`);

        // If the subscription is invalid, deactivate it
        if (errorMessage.includes("410") || errorMessage.includes("invalid")) {
          subscription.isActive = false;
          await subscription.save();
        }
      }
    });

    // Wait for all notifications to be sent
    await Promise.all(sendPromises);

    // Update notification history
    notificationHistory.totalSent = subscriptions.length;
    notificationHistory.successCount = successCount;
    notificationHistory.failureCount = failureCount;
    notificationHistory.status =
      failureCount === 0
        ? "completed"
        : successCount === 0
        ? "failed"
        : "completed";
    notificationHistory.errorLog = errorLog;
    notificationHistory.updatedAt = new Date();

    await notificationHistory.save();

    return NextResponse.json({
      success: true,
      message: "Notifications sent successfully",
      details: {
        totalSent: subscriptions.length,
        successCount,
        failureCount,
        targetUsers: targetUsers.length,
        activeSubscriptions: subscriptions.length,
      },
      notificationId: notificationHistory._id,
    });
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Check admin authentication
    const authCookie = request.cookies.get("cloka_auth");
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify admin user
    const admin = await User.findById(authCookie.value);
    if (!admin || (admin.role !== "admin" && admin.role !== "super-admin")) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get notification history
    const notifications = await NotificationHistory.find({})
      .populate("sentBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await NotificationHistory.countDocuments({});

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notification history:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
