// 1. First, extend your User schema to include Strava data
// models/User.js
import mongoose from 'mongoose';

const StravaStatsSchema = new mongoose.Schema({
  // Personal Records
  fastest5k: { time: Number, date: Date },
  fastest10k: { time: Number, date: Date },
  fastestHalfMarathon: { time: Number, date: Date },
  fastestMarathon: { time: Number, date: Date },
  longestRun: { distance: Number, date: Date },
  
  // Recent Stats (updated periodically)
  weeklyDistance: Number,
  weeklyElevation: Number,
  monthlyDistance: Number,
  monthlyRuns: Number,
  yearlyDistance: Number,
  
  // All-time stats
  totalDistance: Number,
  totalRuns: Number,
  totalElevation: Number,
  
  // Achievement data for gamification
  achievements: [{
    type: String, // 'distance_milestone', 'speed_achievement', 'consistency_streak'
    title: String,
    description: String,
    unlockedAt: Date,
    value: Number
  }],
  
  // Streaks and consistency
  currentStreak: Number,
  longestStreak: Number,
  lastActivityDate: Date,
  
  lastUpdated: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  // Your existing user fields...
  email: String,
  name: String,
  
  // Strava integration
  strava: {
    athleteId: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
    connected: { type: Boolean, default: false },
    profile: {
      firstname: String,
      lastname: String,
      profile: String, // profile image URL
      city: String,
      state: String,
      country: String,
      sex: String,
      weight: Number
    },
    stats: StravaStatsSchema
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);

// 2. Environment variables needed (.env.local)
/*
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
*/

// 3. Strava OAuth API route
// pages/api/auth/strava/connect.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID required' });
  }

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?` +
    `client_id=${process.env.STRAVA_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL + '/api/auth/strava/callback')}&` +
    `approval_prompt=force&` +
    `scope=read,activity:read_all,profile:read_all&` +
    `state=${userId}`;

  res.redirect(stravaAuthUrl);
}

// 4. Strava OAuth callback
// pages/api/auth/strava/callback.js
import User from '../../../../models/User';
import { connectDB } from '../../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, state: userId, error } = req.query;

  if (error) {
    return res.redirect(`/profile?error=${error}`);
  }

  if (!code || !userId) {
    return res.redirect('/profile?error=missing_parameters');
  }

  try {
    await connectDB();

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    // Get athlete profile
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const athleteData = await athleteResponse.json();

    // Update user with Strava data
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'strava.athleteId': athleteData.id.toString(),
        'strava.accessToken': tokenData.access_token,
        'strava.refreshToken': tokenData.refresh_token,
        'strava.tokenExpiresAt': new Date(tokenData.expires_at * 1000),
        'strava.connected': true,
        'strava.profile': {
          firstname: athleteData.firstname,
          lastname: athleteData.lastname,
          profile: athleteData.profile,
          city: athleteData.city,
          state: athleteData.state,
          country: athleteData.country,
          sex: athleteData.sex,
          weight: athleteData.weight
        }
      },
      { new: true }
    );

    // Immediately fetch and store initial stats
    await fetchAndUpdateStravaStats(userId);

    res.redirect('/profile?strava=connected');
  } catch (error) {
    console.error('Strava callback error:', error);
    res.redirect('/profile?error=connection_failed');
  }
}

// 5. Function to fetch and update Strava stats
// lib/strava.js
import User from '../models/User';

export async function refreshStravaToken(userId) {
  const user = await User.findById(userId);
  
  if (!user?.strava?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: user.strava.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await response.json();

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  await User.findByIdAndUpdate(userId, {
    'strava.accessToken': tokenData.access_token,
    'strava.refreshToken': tokenData.refresh_token,
    'strava.tokenExpiresAt': new Date(tokenData.expires_at * 1000),
  });

  return tokenData.access_token;
}

export async function getValidStravaToken(userId) {
  const user = await User.findById(userId);
  
  if (!user?.strava?.accessToken) {
    throw new Error('No Strava token available');
  }

  // Check if token is expired
  if (new Date() >= user.strava.tokenExpiresAt) {
    return await refreshStravaToken(userId);
  }

  return user.strava.accessToken;
}

export async function fetchAndUpdateStravaStats(userId) {
  try {
    const accessToken = await getValidStravaToken(userId);
    
    // Get athlete stats
    const statsResponse = await fetch('https://www.strava.com/api/v3/athletes/stats', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const stats = await statsResponse.json();
    
    // Get recent activities for PBs and achievements
    const activitiesResponse = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=200',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
      'strava.stats': {
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
        lastActivityDate: activities[0]?.start_date ? new Date(activities[0].start_date) : null,
        
        lastUpdated: new Date()
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating Strava stats:', error);
    throw error;
  }
}

function calculatePersonalRecords(activities) {
  const runningActivities = activities.filter(a => a.type === 'Run');
  
  const records = {
    fastest5k: null,
    fastest10k: null,
    fastestHalfMarathon: null,
    fastestMarathon: null,
    longestRun: null
  };
  
  runningActivities.forEach(activity => {
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
      if (!records.fastestHalfMarathon || time < records.fastestHalfMarathon.time) {
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

function calculateAchievements(activities, stats) {
  const achievements = [];
  const totalDistance = stats.all_run_totals?.distance || 0;
  const totalRuns = stats.all_run_totals?.count || 0;
  
  // Distance milestones (in meters)
  const distanceMilestones = [
    { distance: 100000, title: '100K Club', description: 'Ran 100 kilometers total' },
    { distance: 500000, title: 'Half Mega', description: 'Ran 500 kilometers total' },
    { distance: 1000000, title: 'Mega Runner', description: 'Ran 1,000 kilometers total' },
    { distance: 2000000, title: 'Ultra Mega', description: 'Ran 2,000 kilometers total' }
  ];
  
  distanceMilestones.forEach(milestone => {
    if (totalDistance >= milestone.distance) {
      achievements.push({
        type: 'distance_milestone',
        title: milestone.title,
        description: milestone.description,
        value: milestone.distance,
        unlockedAt: new Date() // You might want to calculate the actual unlock date
      });
    }
  });
  
  // Run count achievements
  const runMilestones = [
    { count: 50, title: 'Fifty Runs', description: 'Completed 50 runs' },
    { count: 100, title: 'Century Runner', description: 'Completed 100 runs' },
    { count: 250, title: 'Quarter K', description: 'Completed 250 runs' },
    { count: 500, title: 'Five Hundred Club', description: 'Completed 500 runs' }
  ];
  
  runMilestones.forEach(milestone => {
    if (totalRuns >= milestone.count) {
      achievements.push({
        type: 'run_milestone',
        title: milestone.title,
        description: milestone.description,
        value: milestone.count,
        unlockedAt: new Date()
      });
    }
  });
  
  return achievements;
}

function calculateStreaks(activities) {
  const runningActivities = activities
    .filter(a => a.type === 'Run')
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  const dates = runningActivities.map(a => new Date(a.start_date).toDateString());
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
  let streakStart = null;
  uniqueDates.forEach(dateStr => {
    const date = new Date(dateStr);
    if (!streakStart) {
      streakStart = date;
      tempStreak = 1;
    } else {
      const dayDiff = Math.abs(date - streakStart) / (1000 * 60 * 60 * 24);
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

// 6. API route to manually refresh stats
// pages/api/strava/refresh-stats.js
import { fetchAndUpdateStravaStats } from '../../../lib/strava';
import { connectDB } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID required' });
  }

  try {
    await connectDB();
    await fetchAndUpdateStravaStats(userId);
    res.status(200).json({ message: 'Stats updated successfully' });
  } catch (error) {
    console.error('Error refreshing stats:', error);
    res.status(500).json({ message: 'Failed to refresh stats' });
  }
}

// 7. Frontend component to display gamified stats
// components/StravaStats.jsx
import { useState, useEffect } from 'react';

export default function StravaStats({ user }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/strava/refresh-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      // Refresh the page or update state
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters) => {
    return (meters / 1000).toFixed(2) + ' km';
  };

  if (!user.strava?.connected) {
    return (
      <div className="bg-orange-500 text-white p-4 rounded-lg">
        <h3 className="font-bold mb-2">Connect with Strava</h3>
        <p className="mb-4">Unlock achievements and track your progress!</p>
        <a
          href={`/api/auth/strava/connect?userId=${user._id}`}
          className="bg-white text-orange-500 px-4 py-2 rounded font-bold"
        >
          Connect Strava
        </a>
      </div>
    );
  }

  const stats = user.strava.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Running Stats</h2>
        <button
          onClick={refreshStats}
          disabled={isRefreshing}
          className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
        </button>
      </div>

      {/* Personal Records */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Personal Records 🏆</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.fastest5k && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatTime(stats.fastest5k.time)}
              </div>
              <div className="text-sm text-gray-600">5K PR</div>
            </div>
          )}
          {stats?.fastest10k && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatTime(stats.fastest10k.time)}
              </div>
              <div className="text-sm text-gray-600">10K PR</div>
            </div>
          )}
          {stats?.fastestHalfMarathon && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatTime(stats.fastestHalfMarathon.time)}
              </div>
              <div className="text-sm text-gray-600">Half Marathon PR</div>
            </div>
          )}
          {stats?.longestRun && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatDistance(stats.longestRun.distance)}
              </div>
              <div className="text-sm text-gray-600">Longest Run</div>
            </div>
          )}
        </div>
      </div>

      {/* Current Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Current Stats 📊</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats?.currentStreak || 0}
            </div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatDistance(stats?.weeklyDistance || 0)}
            </div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatDistance(stats?.monthlyDistance || 0)}
            </div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats?.totalRuns || 0}
            </div>
            <div className="text-sm text-gray-600">Total Runs</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {stats?.achievements && stats.achievements.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Achievements 🏅</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl mr-3">🏅</div>
                <div>
                  <div className="font-bold">{achievement.title}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}