import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { NotificationSubscription } from "@/models/Notification";
import User from "@/models/User";

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

    // Get total subscribers (unique users with active subscriptions)
    const subscriberAggregation = await NotificationSubscription.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$userId" } },
      { $count: "totalSubscribers" },
    ]);

    const totalSubscribers = subscriberAggregation[0]?.totalSubscribers || 0;

    // Get subscriber user IDs
    const subscriberUserIds = await NotificationSubscription.find({
      isActive: true,
    }).distinct("userId");

    // Get crew member subscribers
    const crewSubscribers = await User.countDocuments({
      _id: { $in: subscriberUserIds },
      joinCrew: true,
    });

    // Get non-crew member subscribers
    const nonCrewSubscribers = await User.countDocuments({
      _id: { $in: subscriberUserIds },
      $or: [{ joinCrew: false }, { joinCrew: { $exists: false } }],
    });

    // Get total active subscriptions (can be multiple per user)
    const totalSubscriptions = await NotificationSubscription.countDocuments({
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      stats: {
        subscribers: totalSubscribers,
        crewMembers: crewSubscribers,
        nonCrewMembers: nonCrewSubscribers,
        totalSubscriptions: totalSubscriptions,
      },
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
