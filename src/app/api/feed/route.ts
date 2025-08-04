import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserEvent from "@/models/UserEvent";
import Follow from "@/models/Follow";
import Event from "@/models/Event";

// Define types for the data structures
interface CheckInWithUser {
  _id: unknown;
  userId: {
    _id: unknown;
    username: string;
    name: string;
  };
  eventId: unknown;
  checkedInAt: Date;
  createdAt: Date;
}

interface EventData {
  _id: unknown;
  title: string;
  description: string;
  date: Date;
  location: string;
}

interface CheckInWithEventData extends CheckInWithUser {
  eventId: EventData | null;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const feedType = searchParams.get("type") || "global"; // 'global' or 'following'
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get the current user ID from auth cookie
    const authCookie = request.cookies.get("cloka_auth");
    const currentUserId = authCookie?.value;

    const userEventQuery: Record<string, unknown> = {
      checkedIn: true, // Only show check-ins
      checkedInAt: { $ne: null },
    };

    if (feedType === "following") {
      if (!currentUserId) {
        return NextResponse.json(
          {
            success: false,
            message: "Authentication required for following feed",
          },
          { status: 401 }
        );
      }

      // Get list of users that the current user follows
      const followingRelations = await Follow.find({
        followerId: currentUserId,
      })
        .select("followingId")
        .lean();

      const followingUserIds = followingRelations.map(
        (follow) => follow.followingId
      );

      if (followingUserIds.length === 0) {
        // User doesn't follow anyone, return empty feed
        return NextResponse.json({
          success: true,
          activities: [],
          totalCount: 0,
          hasMore: false,
        });
      }

      // Filter to only show check-ins from users they follow
      userEventQuery.userId = { $in: followingUserIds };
    }

    // Get check-in activities
    const checkIns = await UserEvent.find(userEventQuery)
      .populate("userId", "username name _id")
      .sort({ checkedInAt: -1 })
      .skip(offset)
      .limit(limit + 1) // Get one extra to check if there are more
      .lean() as unknown as CheckInWithUser[];

    // Get all event IDs
    const eventIds = checkIns.map((checkIn) => checkIn.eventId);

    // Fetch the actual events
    const events = await Event.find({ _id: { $in: eventIds } }).lean() as unknown as EventData[];

    // Combine check-ins with event data
    const checkInsWithEventData: CheckInWithEventData[] = checkIns.map((checkIn) => {
      const event = events.find(
        (e) => e._id?.toString() === checkIn.eventId?.toString()
      );
      return {
        ...checkIn,
        eventId: event || null,
      };
    });

    // Check if there are more results
    const hasMore = checkInsWithEventData.length > limit;
    if (hasMore) {
      checkInsWithEventData.pop(); // Remove the extra item
    }

    // Get total count for pagination info
    const totalCount = await UserEvent.countDocuments(userEventQuery);

    // Format the activities
    const activities = checkInsWithEventData
      .filter((checkIn) => {
        // Filter out check-ins without proper user or event data
        return checkIn.userId && checkIn.eventId && checkIn.checkedInAt;
      })
      .map((checkIn) => {
        // At this point, we know eventId is not null due to the filter above
        const event = checkIn.eventId!;
        return {
          _id: checkIn._id,
          type: "check-in" as const,
          user: {
            _id: checkIn.userId._id,
            username: checkIn.userId.username,
            name: checkIn.userId.name,
          },
          event: {
            _id: event._id,
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location,
          },
          checkedInAt: checkIn.checkedInAt,
          createdAt: checkIn.checkedInAt, // Use check-in time for sorting
        };
      });

    return NextResponse.json({
      success: true,
      activities,
      totalCount,
      hasMore,
      feedType,
    });
  } catch (error) {
    console.error("Error getting feed data:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
