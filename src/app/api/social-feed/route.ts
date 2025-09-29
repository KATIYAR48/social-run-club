import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SocialPost } from "@/models/SocialPost";
import User from "@/models/User";

// GET - Fetch social feed
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type"); // Filter by post type

    // Get user ID if authenticated
    const authCookie = request.cookies.get("cloka_auth");
    let currentUserId: string | null = null;

    if (authCookie?.value) {
      try {
        const user = await User.findById(authCookie.value);
        if (user) {
          currentUserId = authCookie.value;
        }
      } catch {
        // Invalid user ID, continue as guest
      }
    }

    let posts;
    if (currentUserId) {
      // Authenticated user - get personalized feed
      posts = await SocialPost.getFeedForUser(currentUserId, page, limit);
    } else {
      // Guest user - get public feed
      const skip = (page - 1) * limit;
      const query: Record<string, unknown> = { visibility: 'public' };
      
      if (type) {
        query.type = type;
      }

      posts = await SocialPost.find(query)
        .populate('userId', 'name username profileImage')
        .populate('runId', 'distance duration pace')
        .populate('eventId', 'title date location')
        .populate('achievementId', 'name nameHindi icon rarity')
        .populate('comments.userId', 'name username profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          hasNext: posts.length === limit
        }
      }
    });
  } catch (error) {
    console.error("Error fetching social feed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch social feed" },
      { status: 500 }
    );
  }
}

// POST - Create a new social post
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
      type,
      content,
      photos = [],
      location,
      tags = [],
      visibility = 'public'
    } = body;

    // Validate required fields
    if (!type || !content) {
      return NextResponse.json(
        { success: false, message: "Type and content are required" },
        { status: 400 }
      );
    }

    // Create post
    const post = new SocialPost({
      userId,
      type,
      content: content.trim(),
      photos,
      location,
      tags: tags.map((tag: string) => tag.trim().toLowerCase()),
      visibility,
      isPublic: visibility === 'public'
    });

    await post.save();

    // Populate user data for response
    await post.populate('userId', 'name username profileImage');

    return NextResponse.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    console.error("Error creating social post:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create post" },
      { status: 500 }
    );
  }
}