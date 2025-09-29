import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Run from "@/models/Run";
import { Achievement } from "@/models/Achievement";
import { SocialPost } from "@/models/SocialPost";
import User from "@/models/User";

// GET - Fetch user's runs or public runs
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "date";
    const order = searchParams.get("order") || "desc";

    // Verify authentication for user's own runs
    const authCookie = request.cookies.get("cloka_auth");
    let currentUserId: string | null = null;

    if (authCookie?.value) {
      // Validate user exists
      try {
        const user = await User.findById(authCookie.value);
        if (user) {
          currentUserId = authCookie.value;
        }
      } catch {
        // Invalid user ID, continue as guest
      }
    }

    const skip = (page - 1) * limit;
    let query: Record<string, unknown> = {};

    if (userId) {
      // If requesting specific user's runs
      if (userId === currentUserId) {
        // Own runs - show all
        query.userId = userId;
      } else {
        // Other user's runs - only public ones
        query = { userId, isPublic: true };
      }
    } else {
      // Public runs only
      query.isPublic = true;
    }

    const sortOption: Record<string, 1 | -1> = {};
    sortOption[sort] = order === "desc" ? -1 : 1;

    const runs = await Run.find(query)
      .populate('userId', 'name username profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Run.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        runs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

// POST - Create a new run
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authCookie = request.cookies.get("cloka_auth");
    if (!authCookie?.value) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate user exists
    const user = await User.findById(authCookie.value);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid authentication" },
        { status: 401 }
      );
    }

    const userId = authCookie.value;
    const body = await request.json();
    const {
      title,
      distance,
      duration,
      date,
      route,
      notes,
      location,
      weather,
      elevationGain,
      calories,
      averageHeartRate,
      isPublic = true,
      tags = [],
      photos = []
    } = body;

    // Validate required fields
    if (!title || !distance || !duration || !date) {
      return NextResponse.json(
        { success: false, message: "Title, distance, duration, and date are required" },
        { status: 400 }
      );
    }

    // Calculate pace (minutes per km)
    const pace = duration / distance;

    // Create run
    const run = new Run({
      userId,
      title: title.trim(),
      distance: parseFloat(distance),
      duration: parseInt(duration),
      pace,
      date: new Date(date),
      route: route?.trim(),
      notes: notes?.trim(),
      location,
      weather,
      elevationGain: elevationGain ? parseInt(elevationGain) : 0,
      calories: calories ? parseInt(calories) : null,
      averageHeartRate: averageHeartRate ? parseInt(averageHeartRate) : null,
      isPublic,
      tags: tags.map((tag: string) => tag.trim().toLowerCase()),
      photos
    });

    await run.save();

    // Check for new achievements
    const newAchievements = await Achievement.checkAndAwardAchievements(userId, run);

    // Create social post for the run
    if (isPublic) {
      await SocialPost.createRunPost(userId, run);
    }

    // Create social posts for new achievements
    for (const achievement of newAchievements) {
      await SocialPost.createAchievementPost(userId, achievement);
    }

    // Populate user data for response
    await run.populate('userId', 'name username profileImage');

    return NextResponse.json({
      success: true,
      data: {
        run,
        newAchievements: newAchievements.map(a => ({
          name: a.name,
          nameHindi: a.nameHindi,
          description: a.description,
          icon: a.icon,
          points: a.points,
          rarity: a.rarity
        }))
      }
    });
  } catch (error) {
    console.error("Error creating run:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create run" },
      { status: 500 }
    );
  }
}