import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Run from "@/models/Run";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // week, month, year, all_time
    const category = searchParams.get("category") || "distance"; // distance, pace, runs, consistency
    const limit = parseInt(searchParams.get("limit") || "20");

    let leaderboardData = [];

    switch (category) {
      case "distance":
        leaderboardData = await Run.getLeaderboardData(period);
        break;

      case "pace":
        leaderboardData = await getLeaderboardByPace(period, limit);
        break;

      case "runs":
        leaderboardData = await getLeaderboardByRunCount(period, limit);
        break;

      case "consistency":
        leaderboardData = await getLeaderboardByConsistency(period, limit);
        break;

      default:
        leaderboardData = await Run.getLeaderboardData(period);
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: leaderboardData.slice(0, limit),
        period,
        category,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

async function getLeaderboardByPace(period: string, limit: number) {
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  const leaderboard = await Run.aggregate([
    { 
      $match: { 
        date: period === 'all_time' ? {} : { $gte: startDate },
        isPublic: true,
        distance: { $gte: 1 } // At least 1km to qualify for pace leaderboard
      } 
    },
    {
      $group: {
        _id: '$userId',
        bestPace: { $min: '$pace' },
        averagePace: { $avg: '$pace' },
        totalRuns: { $sum: 1 },
        totalDistance: { $sum: '$distance' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        username: '$user.username',
        profileImage: '$user.profileImage',
        bestPace: 1,
        averagePace: 1,
        totalRuns: 1,
        totalDistance: 1
      }
    },
    { $sort: { bestPace: 1 } }, // Ascending order for pace (lower is better)
    { $limit: limit }
  ]);

  return leaderboard;
}

async function getLeaderboardByRunCount(period: string, limit: number) {
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  const leaderboard = await Run.aggregate([
    { 
      $match: { 
        date: period === 'all_time' ? {} : { $gte: startDate },
        isPublic: true
      } 
    },
    {
      $group: {
        _id: '$userId',
        totalRuns: { $sum: 1 },
        totalDistance: { $sum: '$distance' },
        averagePace: { $avg: '$pace' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        username: '$user.username',
        profileImage: '$user.profileImage',
        totalRuns: 1,
        totalDistance: 1,
        averagePace: 1
      }
    },
    { $sort: { totalRuns: -1 } },
    { $limit: limit }
  ]);

  return leaderboard;
}

async function getLeaderboardByConsistency(period: string, limit: number) {
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  // Calculate consistency score based on how many days the user ran
  const leaderboard = await Run.aggregate([
    { 
      $match: { 
        date: period === 'all_time' ? {} : { $gte: startDate },
        isPublic: true
      } 
    },
    {
      $group: {
        _id: {
          userId: '$userId',
          day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        }
      }
    },
    {
      $group: {
        _id: '$_id.userId',
        uniqueDays: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'runs',
        let: { userId: '$_id' },
        pipeline: [
          { 
            $match: { 
              $expr: { $eq: ['$userId', '$$userId'] },
              date: period === 'all_time' ? {} : { $gte: startDate },
              isPublic: true
            } 
          },
          {
            $group: {
              _id: null,
              totalRuns: { $sum: 1 },
              totalDistance: { $sum: '$distance' }
            }
          }
        ],
        as: 'stats'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $unwind: '$stats' },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        username: '$user.username',
        profileImage: '$user.profileImage',
        uniqueDays: 1,
        totalRuns: '$stats.totalRuns',
        totalDistance: '$stats.totalDistance',
        consistencyScore: {
          $round: [
            { $multiply: [{ $divide: ['$uniqueDays', '$stats.totalRuns'] }, 100] },
            1
          ]
        }
      }
    },
    { $sort: { consistencyScore: -1, uniqueDays: -1 } },
    { $limit: limit }
  ]);

  return leaderboard;
}