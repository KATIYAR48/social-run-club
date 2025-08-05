import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserEvent from "@/models/UserEvent";
import mongoose, { PipelineStage } from "mongoose";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    // Authenticate and check admin
    const authCookie = request.cookies.get("cloka_auth");
    if (!authCookie || !authCookie.value) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const adminUser = await User.findById(authCookie.value);
    if (
      !adminUser ||
      (adminUser.role !== "admin" && adminUser.role !== "super-admin")
    ) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const eventId = searchParams.get("eventId") || "";
    const approved = searchParams.get("approved") || "";
    const search = searchParams.get("search") || "";
    const ageRange = searchParams.get("ageRange") || "";
    const sex = searchParams.get("sex") || "";
    const countOnly = searchParams.get("countOnly") === "true";
    const emailsOnly = searchParams.get("emailsOnly") === "true";
    const formatCsv = searchParams.get("format") === "csv";

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build match stage for aggregation
    const matchStage: Record<string, unknown> = {};

    // Filter by event
    if (eventId) {
      matchStage.eventId = new mongoose.Types.ObjectId(eventId);
    }

    // Filter by approval status
    if (approved === "true") {
      matchStage.approved = true;
    } else if (approved === "false") {
      matchStage.approved = false;
    } else if (approved === "pending") {
      matchStage.approved = null;
    }

    // Build the aggregation pipeline
    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      // Lookup users
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      // Lookup events
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      // Unwind the arrays created by lookup
      { $unwind: { path: "$userDetails" } },
      { $unwind: { path: "$eventDetails" } },
    ];

    // Add search filter if provided
    if (search) {
      // Add a match stage after the lookups to filter by user fields
      pipeline.push({
        $match: {
          $or: [
            { "userDetails.name": { $regex: search, $options: "i" } },
            { "userDetails.email": { $regex: search, $options: "i" } },
            {
              "userDetails.instagramUsername": {
                $regex: search,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    // Add age range filter if provided
    if (ageRange) {
      if (ageRange === "56+") {
        pipeline.push({
          $match: { "userDetails.age": { $gte: 56 } },
        });
      } else {
        const [minAge, maxAge] = ageRange.split("-").map(Number);
        pipeline.push({
          $match: {
            "userDetails.age": {
              $gte: minAge,
              ...(maxAge && { $lte: maxAge }),
            },
          },
        });
      }
    }

    // Add gender/sex filter if provided
    if (sex) {
      pipeline.push({
        $match: { "userDetails.gender": sex },
      });
    }

    // Add user check-in statistics lookup
    pipeline.push({
      $lookup: {
        from: "userevents",
        let: { userId: "$userId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              checkedInEvents: {
                $sum: { $cond: ["$checkedIn", 1, 0] },
              },
            },
          },
        ],
        as: "userStats",
      },
    });

    // Create a copy of the pipeline for stats calculation
    const statsPipeline = [...pipeline];

    // For countOnly requests or to include stats, we need to calculate counts by approval status
    const approvalCounts = await calculateApprovalCounts(statsPipeline);

    // If countOnly is true, return only the counts
    if (countOnly) {
      return NextResponse.json({
        success: true,
        counts: {
          total: approvalCounts.total,
          approved: approvalCounts.approved,
          rejected: approvalCounts.rejected,
          pending: approvalCounts.pending,
        },
      });
    }

    // If emailsOnly is true, return only the email addresses
    if (emailsOnly) {
      // Create a pipeline to extract just the emails
      const emailsPipeline = [...pipeline];

      // Project only the email field
      emailsPipeline.push({
        $project: {
          _id: 0,
          email: "$userDetails.email",
        },
      });

      // Execute the aggregation to get all emails
      const emailsResult = await UserEvent.aggregate(emailsPipeline);

      // Extract just the email strings from the result
      const emails = emailsResult.map((item) => item.email).filter(Boolean);

      return NextResponse.json({
        success: true,
        emails,
        count: emails.length,
      });
    }

    // If format=csv, return all registrations without pagination
    if (formatCsv) {
      // Create a pipeline for full CSV data without pagination
      const csvPipeline = [...pipeline];

      // Project the final shape of the documents
      csvPipeline.push({
        $project: {
          _id: 1,
          userId: 1,
          eventId: 1,
          approved: 1,
          checkedIn: 1,
          checkedInAt: 1,
          createdAt: 1,
          user: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
            phone: "$userDetails.phone",
            age: "$userDetails.age",
            sex: "$userDetails.gender",
            instagram: "$userDetails.instagramUsername",
          },
          event: {
            _id: "$eventDetails._id",
            title: "$eventDetails.title",
            date: "$eventDetails.date",
            location: "$eventDetails.location",
          },
          userStats: {
            $cond: {
              if: { $gt: [{ $size: "$userStats" }, 0] },
              then: { $arrayElemAt: ["$userStats", 0] },
              else: { totalEvents: 0, checkedInEvents: 0 },
            },
          },
        },
      });

      // Execute the aggregation without pagination
      const allRegistrations = await UserEvent.aggregate(csvPipeline);

      return NextResponse.json({
        success: true,
        registrations: allRegistrations,
        count: allRegistrations.length,
      });
    }

    // Project the final shape of the documents
    pipeline.push({
      $project: {
        _id: 1,
        userId: 1,
        eventId: 1,
        approved: 1,
        checkedIn: 1,
        checkedInAt: 1,
        createdAt: 1,
        user: {
          _id: "$userDetails._id",
          name: "$userDetails.name",
          email: "$userDetails.email",
          phone: "$userDetails.phone",
          age: "$userDetails.age",
          sex: "$userDetails.gender",
          instagram: "$userDetails.instagramUsername",
        },
        event: {
          _id: "$eventDetails._id",
          title: "$eventDetails.title",
          date: "$eventDetails.date",
          location: "$eventDetails.location",
        },
        userStats: {
          $cond: {
            if: { $gt: [{ $size: "$userStats" }, 0] },
            then: { $arrayElemAt: ["$userStats", 0] },
            else: { totalEvents: 0, checkedInEvents: 0 },
          },
        },
      },
    });

    // Apply pagination after all filters
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute the aggregation
    const eventRegistrations = await UserEvent.aggregate(pipeline);

    // Count total documents for pagination
    // We need to build a separate count pipeline without skip, limit, and projection
    const countPipeline: PipelineStage[] = [
      { $match: matchStage },
      // Lookup users for filtering
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
    ];

    // Add the same filters as the main pipeline
    if (search) {
      countPipeline.push({
        $match: {
          $or: [
            { "userDetails.name": { $regex: search, $options: "i" } },
            { "userDetails.email": { $regex: search, $options: "i" } },
            {
              "userDetails.instagramUsername": {
                $regex: search,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    if (ageRange) {
      if (ageRange === "56+") {
        countPipeline.push({
          $match: { "userDetails.age": { $gte: 56 } },
        });
      } else {
        const [minAge, maxAge] = ageRange.split("-").map(Number);
        countPipeline.push({
          $match: {
            "userDetails.age": {
              $gte: minAge,
              ...(maxAge && { $lte: maxAge }),
            },
          },
        });
      }
    }

    if (sex) {
      countPipeline.push({
        $match: { "userDetails.gender": sex },
      });
    }

    // Add count stage
    countPipeline.push({ $count: "total" });

    const countResult = await UserEvent.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    // Calculate counts for summary
    const approvedCount = await UserEvent.countDocuments({
      ...matchStage,
      approved: true,
    });
    const rejectedCount = await UserEvent.countDocuments({
      ...matchStage,
      approved: false,
    });
    const pendingCount = await UserEvent.countDocuments({
      ...matchStage,
      approved: null,
    });
    const checkedInCount = await UserEvent.countDocuments({
      ...matchStage,
      checkedIn: true,
    });

    return NextResponse.json({
      registrations: eventRegistrations || [],
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      stats: {
        total: totalCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pending: pendingCount,
        checkedIn: checkedInCount,
      },
    });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch event registrations" },
      { status: 500 }
    );
  }
}

// Helper function to calculate counts by approval status
async function calculateApprovalCounts(pipeline: PipelineStage[]) {
  // Create a facet to count by approval status
  const facetPipeline = [...pipeline];

  facetPipeline.push({
    $facet: {
      total: [{ $count: "count" }],
      approved: [{ $match: { approved: true } }, { $count: "count" }],
      rejected: [{ $match: { approved: false } }, { $count: "count" }],
      pending: [{ $match: { approved: null } }, { $count: "count" }],
    },
  });

  const result = await UserEvent.aggregate(facetPipeline);

  // Extract counts from the result
  return {
    total: result[0].total.length > 0 ? result[0].total[0].count : 0,
    approved: result[0].approved.length > 0 ? result[0].approved[0].count : 0,
    rejected: result[0].rejected.length > 0 ? result[0].rejected[0].count : 0,
    pending: result[0].pending.length > 0 ? result[0].pending[0].count : 0,
  };
}
