import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { NotificationSubscription } from "@/models/Notification";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const authCookie = request.cookies.get("cloka_auth");
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await User.findById(authCookie.value);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { subscription } = body;

    // Validate subscription object
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, message: "Invalid subscription data" },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;

    if (!keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { success: false, message: "Missing subscription keys" },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existingSubscription = await NotificationSubscription.findOne({
      endpoint: endpoint,
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.userId = user._id;
      existingSubscription.keys = keys;
      existingSubscription.userAgent =
        request.headers.get("user-agent") || undefined;
      existingSubscription.isActive = true;
      existingSubscription.updatedAt = new Date();

      await existingSubscription.save();

      return NextResponse.json({
        success: true,
        message: "Subscription updated successfully",
        subscription: existingSubscription,
      });
    }

    // Create new subscription
    const newSubscription = new NotificationSubscription({
      userId: user._id,
      endpoint: endpoint,
      keys: keys,
      userAgent: request.headers.get("user-agent") || undefined,
      isActive: true,
    });

    await newSubscription.save();

    return NextResponse.json({
      success: true,
      message: "Subscription created successfully",
      subscription: newSubscription,
    });
  } catch (error) {
    console.error("Error managing notification subscription:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const authCookie = request.cookies.get("cloka_auth");
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await User.findById(authCookie.value);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, message: "Endpoint required" },
        { status: 400 }
      );
    }

    // Find and deactivate the subscription
    const subscription = await NotificationSubscription.findOne({
      endpoint: endpoint,
      userId: user._id,
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      );
    }

    subscription.isActive = false;
    subscription.updatedAt = new Date();
    await subscription.save();

    return NextResponse.json({
      success: true,
      message: "Subscription unsubscribed successfully",
    });
  } catch (error) {
    console.error("Error unsubscribing from notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const authCookie = request.cookies.get("cloka_auth");
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await User.findById(authCookie.value);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get user's active subscriptions
    const subscriptions = await NotificationSubscription.find({
      userId: user._id,
      isActive: true,
    }).select("endpoint userAgent createdAt");

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions,
    });
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
