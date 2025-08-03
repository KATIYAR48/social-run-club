import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserEvent from "@/models/UserEvent";
import Event from "@/models/Event";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // Connect to the database
    await dbConnect();

    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required" },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get the current user ID if authenticated (to determine if this is their own profile)
    const authCookie = request.cookies.get("cloka_auth");
    const isOwnProfile = authCookie?.value === user._id.toString();

    // Get user's events
    const userEvents = await UserEvent.find({ userId: user._id }).sort({
      createdAt: -1,
    });

    // Get all event IDs
    const eventIds = userEvents.map((userEvent) => userEvent.eventId);

    // Fetch the actual events
    const events = await Event.find({ _id: { $in: eventIds } });

    // Combine user events with event data
    const userEventsWithEventData = userEvents.map((userEvent) => {
      const event = events.find(
        (e) => e._id.toString() === userEvent.eventId.toString()
      );
      return {
        ...userEvent.toObject(),
        eventId: event || null,
      };
    });

    // Filter events based on approval status and whether it's own profile
    const approvedEvents = userEventsWithEventData.filter(
      (ue) => ue.approved === true && ue.eventId
    );
    const pendingEvents = isOwnProfile
      ? userEventsWithEventData.filter(
          (ue) => ue.approved === null && ue.eventId
        )
      : [];

    // Calculate stats
    const totalEvents = approvedEvents.length;
    const upcomingEvents = approvedEvents.filter((ue) => {
      if (!ue.eventId || !ue.eventId.date) return false;
      const eventDate = new Date(ue.eventId.date);
      return eventDate >= new Date();
    }).length;
    const completedEvents = approvedEvents.filter((ue) => {
      if (!ue.eventId || !ue.eventId.date) return false;
      const eventDate = new Date(ue.eventId.date);
      return eventDate < new Date();
    }).length;

    // Public profile data
    const profileData = {
      _id: user._id,
      name: user.name,
      username: user.username,
      joinDate: user.createdAt,
      role: user.role,
      // Conditional fields based on ownership
      ...(isOwnProfile && {
        email: user.email,
        phone: user.phone,
        emergencyContact: user.emergencyContact,
      }),
      // Always public fields
      age: user.age,
      gender: user.gender,
      instagramUsername: user.instagramUsername,
      joinCrew: user.joinCrew,
      // Strava data (only for own profile)
      ...(isOwnProfile && {
        strava: user.strava,
      }),
      // Stats
      stats: {
        totalEvents,
        upcomingEvents,
        completedEvents,
      },
      // Events
      events: {
        approved: approvedEvents
          .filter((ue) => ue.eventId) // Extra safety check
          .map((ue) => ({
            _id: ue._id,
            event: {
              _id: ue.eventId._id,
              title: ue.eventId.title,
              description: ue.eventId.description,
              date: ue.eventId.date,
              location: ue.eventId.location,
            },
            checkedIn: ue.checkedIn,
            checkedInAt: ue.checkedInAt,
            registeredAt: ue.createdAt,
          })),
        ...(isOwnProfile && {
          pending: pendingEvents
            .filter((ue) => ue.eventId) // Extra safety check
            .map((ue) => ({
              _id: ue._id,
              event: {
                _id: ue.eventId._id,
                title: ue.eventId.title,
                description: ue.eventId.description,
                date: ue.eventId.date,
                location: ue.eventId.location,
              },
              registeredAt: ue.createdAt,
            })),
        }),
      },
      isOwnProfile,
    };

    return NextResponse.json({
      success: true,
      profile: profileData,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching profile" },
      { status: 500 }
    );
  }
}
