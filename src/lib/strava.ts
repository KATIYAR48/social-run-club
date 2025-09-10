import User from "../models/User";

// Rate limiting for Strava API calls
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 100; // Conservative limit

async function checkRateLimit(): Promise<void> {
  const now = Date.now();
  const key = "strava_api";

  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return;
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    const waitTime = current.resetTime - now;
    throw new Error(
      `Rate limit exceeded. Please try again in ${Math.ceil(
        waitTime / 1000
      )} seconds.`
    );
  }

  current.count++;
}

async function makeStravaRequest(
  url: string,
  options: RequestInit
): Promise<Response> {
  await checkRateLimit();

  const response = await fetch(url, options);

  // Handle specific Strava errors
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.message?.includes("Limit of connected athletes exceeded")) {
      throw new Error("STRAVA_QUOTA_EXCEEDED");
    }
    throw new Error(`Strava API error: ${errorData.message || "Forbidden"}`);
  }

  if (response.status === 429) {
    throw new Error("STRAVA_RATE_LIMIT");
  }

  return response;
}

export async function refreshStravaToken(userId: string) {
  const user = await User.findById(userId);

  if (!user?.strava?.refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await makeStravaRequest(
    "https://www.strava.com/oauth/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: user.strava.refreshToken,
        grant_type: "refresh_token",
      }),
    }
  );

  const tokenData = await response.json();

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  await User.findByIdAndUpdate(userId, {
    "strava.accessToken": tokenData.access_token,
    "strava.refreshToken": tokenData.refresh_token,
    "strava.tokenExpiresAt": new Date(tokenData.expires_at * 1000),
  });

  return tokenData.access_token;
}

export async function getValidStravaToken(userId: string) {
  const user = await User.findById(userId);

  if (!user?.strava?.accessToken) {
    throw new Error("No Strava token available");
  }

  // Check if token is expired
  if (new Date() >= user.strava.tokenExpiresAt!) {
    return await refreshStravaToken(userId);
  }

  return user.strava.accessToken;
}

interface StravaActivity {
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
}

interface PersonalRecord {
  time: number;
  date: Date;
}

interface LongestRun {
  distance: number;
  date: Date;
}

interface PersonalRecords {
  fastest5k: PersonalRecord | null;
  fastest10k: PersonalRecord | null;
  fastestHalfMarathon: PersonalRecord | null;
  fastestMarathon: PersonalRecord | null;
  longestRun: LongestRun | null;
}

function calculatePersonalRecords(activities: StravaActivity[]) {
  const runningActivities = activities.filter(
    (a: StravaActivity) => a.type === "Run"
  );

  const records: PersonalRecords = {
    fastest5k: null,
    fastest10k: null,
    fastestHalfMarathon: null,
    fastestMarathon: null,
    longestRun: null,
  };

  runningActivities.forEach((activity: StravaActivity) => {
    const distance = activity.distance; // in meters
    const time = activity.moving_time; // in seconds
    const date = new Date(activity.start_date);

    // Check for 5K (4800-5200m range)
    if (distance >= 4800 && distance <= 5200) {
      if (!records.fastest5k || time < records.fastest5k.time) {
        records.fastest5k = { time, date };
      }
    }

    // Check for 10K (9800-10200m range)
    if (distance >= 9800 && distance <= 10200) {
      if (!records.fastest10k || time < records.fastest10k.time) {
        records.fastest10k = { time, date };
      }
    }

    // Check for Half Marathon (21000-21200m range)
    if (distance >= 21000 && distance <= 21200) {
      if (
        !records.fastestHalfMarathon ||
        time < records.fastestHalfMarathon.time
      ) {
        records.fastestHalfMarathon = { time, date };
      }
    }

    // Check for Marathon (42000-42300m range)
    if (distance >= 42000 && distance <= 42300) {
      if (!records.fastestMarathon || time < records.fastestMarathon.time) {
        records.fastestMarathon = { time, date };
      }
    }

    // Check for longest run
    if (!records.longestRun || distance > records.longestRun.distance) {
      records.longestRun = { distance, date };
    }
  });

  return records;
}

interface StravaStats {
  all_run_totals?: {
    distance: number;
    count: number;
  };
}

function calculateAchievements(
  activities: StravaActivity[],
  stats: StravaStats
) {
  const achievements = [];
  const totalDistance = stats.all_run_totals?.distance || 0;
  const totalRuns = stats.all_run_totals?.count || 0;

  // Distance milestones (in meters)
  const distanceMilestones = [
    {
      distance: 100000,
      title: "100K Club",
      description: "Ran 100 kilometers total",
    },
    {
      distance: 500000,
      title: "Half Mega",
      description: "Ran 500 kilometers total",
    },
    {
      distance: 1000000,
      title: "Mega Runner",
      description: "Ran 1,000 kilometers total",
    },
    {
      distance: 2000000,
      title: "Ultra Mega",
      description: "Ran 2,000 kilometers total",
    },
  ];

  distanceMilestones.forEach((milestone) => {
    if (totalDistance >= milestone.distance) {
      achievements.push({
        type: "distance_milestone",
        title: milestone.title,
        description: milestone.description,
        value: milestone.distance,
        unlockedAt: new Date(), // You might want to calculate the actual unlock date
      });
    }
  });

  // Run count achievements
  const runMilestones = [
    { count: 50, title: "Fifty Runs", description: "Completed 50 runs" },
    { count: 100, title: "Century Runner", description: "Completed 100 runs" },
    { count: 250, title: "Quarter K", description: "Completed 250 runs" },
    {
      count: 500,
      title: "Five Hundred Club",
      description: "Completed 500 runs",
    },
  ];

  runMilestones.forEach((milestone) => {
    if (totalRuns >= milestone.count) {
      achievements.push({
        type: "run_milestone",
        title: milestone.title,
        description: milestone.description,
        value: milestone.count,
        unlockedAt: new Date(),
      });
    }
  });

  return achievements;
}

function calculateStreaks(activities: StravaActivity[]) {
  const runningActivities = activities
    .filter((a: StravaActivity) => a.type === "Run")
    .sort(
      (a: StravaActivity, b: StravaActivity) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  const dates = runningActivities.map((a: StravaActivity) =>
    new Date(a.start_date).toDateString()
  );
  const uniqueDates = [...new Set(dates)];

  // Calculate current streak
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);

    if (uniqueDates.includes(checkDate.toDateString())) {
      if (i === 0 || currentStreak > 0) {
        currentStreak++;
      }
    } else if (i > 1) {
      break;
    }
  }

  // Calculate longest streak
  let streakStart: Date | null = null;
  uniqueDates.forEach((dateStr) => {
    const date = new Date(dateStr);
    if (!streakStart) {
      streakStart = date;
      tempStreak = 1;
    } else {
      const dayDiff =
        Math.abs(date.getTime() - streakStart.getTime()) /
        (1000 * 60 * 60 * 24);
      if (dayDiff <= 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        streakStart = date;
      }
    }
  });

  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

export async function fetchAndUpdateStravaStats(userId: string) {
  try {
    const accessToken = await getValidStravaToken(userId);

    // Check if we have recent cached data (within last hour)
    const user = await User.findById(userId);
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (
      user?.strava?.stats?.lastUpdated &&
      new Date(user.strava.stats.lastUpdated) > oneHourAgo
    ) {
      console.log("Using cached Strava stats for user:", userId);
      return; // Use cached data
    }

    // Get athlete stats
    const statsResponse = await makeStravaRequest(
      "https://www.strava.com/api/v3/athletes/stats",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const stats = await statsResponse.json();

    // Get recent activities for PBs and achievements (reduced from 200 to 50 to save quota)
    const activitiesResponse = await makeStravaRequest(
      "https://www.strava.com/api/v3/athlete/activities?per_page=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const activities = await activitiesResponse.json();

    // Calculate personal records and achievements
    const personalRecords = calculatePersonalRecords(activities);
    const achievements = calculateAchievements(activities, stats);
    const streaks = calculateStreaks(activities);

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      "strava.stats": {
        // Personal Records
        fastest5k: personalRecords.fastest5k,
        fastest10k: personalRecords.fastest10k,
        fastestHalfMarathon: personalRecords.fastestHalfMarathon,
        fastestMarathon: personalRecords.fastestMarathon,
        longestRun: personalRecords.longestRun,

        // Current period stats
        weeklyDistance: stats.recent_run_totals?.distance || 0,
        weeklyElevation: stats.recent_run_totals?.elevation_gain || 0,
        monthlyDistance: stats.recent_run_totals?.distance || 0,
        monthlyRuns: stats.recent_run_totals?.count || 0,
        yearlyDistance: stats.ytd_run_totals?.distance || 0,

        // All-time stats
        totalDistance: stats.all_run_totals?.distance || 0,
        totalRuns: stats.all_run_totals?.count || 0,
        totalElevation: stats.all_run_totals?.elevation_gain || 0,

        // Achievements and streaks
        achievements,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        lastActivityDate: activities[0]?.start_date
          ? new Date(activities[0].start_date)
          : null,

        lastUpdated: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating Strava stats:", error);

    // Handle specific Strava errors
    if (error instanceof Error) {
      if (error.message === "STRAVA_QUOTA_EXCEEDED") {
        throw new Error(
          "Strava quota exceeded. Please contact support for quota increase."
        );
      }
      if (error.message === "STRAVA_RATE_LIMIT") {
        throw new Error("Strava rate limit exceeded. Please try again later.");
      }
    }

    throw error;
  }
}
