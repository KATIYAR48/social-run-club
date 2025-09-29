'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { TrophyIcon, FireIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/solid';

interface LeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  profileImage?: string;
  totalDistance?: number;
  totalRuns?: number;
  bestPace?: number;
  averagePace?: number;
  consistencyScore?: number;
  uniqueDays?: number;
}

interface LeaderboardCardProps {
  title?: string;
  titleHindi?: string;
  category?: 'distance' | 'pace' | 'runs' | 'consistency';
  period?: 'week' | 'month' | 'year' | 'all_time';
  limit?: number;
  showFilters?: boolean;
}

const periodLabels = {
  week: { en: 'This Week', hi: 'इस सप्ताह' },
  month: { en: 'This Month', hi: 'इस महीने' },
  year: { en: 'This Year', hi: 'इस वर्ष' },
  all_time: { en: 'All Time', hi: 'हमेशा' }
};

const categoryLabels = {
  distance: { en: 'Distance Leaders', hi: 'दूरी के नेता', icon: TrophyIcon },
  pace: { en: 'Speed Demons', hi: 'तेज़ धावक', icon: FireIcon },
  runs: { en: 'Most Active', hi: 'सबसे सक्रिय', icon: CalendarIcon },
  consistency: { en: 'Consistency Kings', hi: 'निरंतरता के राजा', icon: ClockIcon }
};

export default function LeaderboardCard({
  title,
  titleHindi,
  category = 'distance',
  period = 'month',
  limit = 10,
  showFilters = true
}: LeaderboardCardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState(category);
  const [currentPeriod, setCurrentPeriod] = useState(period);

  useEffect(() => {
    fetchLeaderboard();
  }, [currentCategory, currentPeriod, limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?category=${currentCategory}&period=${currentPeriod}&limit=${limit}`);
      const result = await response.json();
      
      if (result.success) {
        setLeaderboard(result.data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (distance: number) => {
    return distance >= 1000 ? `${(distance / 1000).toFixed(1)}k km` : `${distance.toFixed(1)} km`;
  };

  const formatPace = (pace: number) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = () => {
    const IconComponent = categoryLabels[currentCategory].icon;
    return <IconComponent className="w-5 h-5" />;
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `#${position + 1}`;
    }
  };

  const getStatValue = (entry: LeaderboardEntry) => {
    switch (currentCategory) {
      case 'distance':
        return formatDistance(entry.totalDistance || 0);
      case 'pace':
        return formatPace(entry.bestPace || 0);
      case 'runs':
        return `${entry.totalRuns || 0} runs`;
      case 'consistency':
        return `${entry.consistencyScore || 0}%`;
      default:
        return '';
    }
  };

  const getSecondaryValue = (entry: LeaderboardEntry) => {
    switch (currentCategory) {
      case 'distance':
        return `${entry.totalRuns || 0} runs`;
      case 'pace':
        return formatDistance(entry.totalDistance || 0);
      case 'runs':
        return formatDistance(entry.totalDistance || 0);
      case 'consistency':
        return `${entry.uniqueDays || 0} days`;
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            {getCategoryIcon()}
            <span className="ml-2">
              {title || categoryLabels[currentCategory].en}
            </span>
          </h3>
          {(titleHindi || categoryLabels[currentCategory].hi) && (
            <p className="text-sm text-gray-600 mt-1">
              {titleHindi || categoryLabels[currentCategory].hi}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {periodLabels[currentPeriod].en} • {periodLabels[currentPeriod].hi}
          </p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCurrentCategory(key as 'distance' | 'pace' | 'runs' | 'consistency')}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  currentCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label.en}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(periodLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCurrentPeriod(key as 'week' | 'month' | 'year' | 'all_time')}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  currentPeriod === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
            </div>
          ))
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No runners found for this period</p>
            <p className="text-sm text-gray-400 mt-1">इस अवधि के लिए कोई धावक नहीं मिले</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
              }`}
            >
              {/* Rank */}
              <div className="text-lg font-bold w-8 text-center">
                {getRankIcon(index)}
              </div>

              {/* Profile Image */}
              <div className="w-10 h-10 relative">
                {entry.profileImage ? (
                  <Image
                    src={entry.profileImage}
                    alt={entry.name}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {entry.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{entry.name}</h4>
                <p className="text-sm text-gray-600">@{entry.username}</p>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="font-bold text-gray-900">{getStatValue(entry)}</div>
                <div className="text-xs text-gray-500">{getSecondaryValue(entry)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {!loading && leaderboard.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Keep running to climb the leaderboard! • दौड़ते रहें और लीडरबोर्ड में आगे बढ़ें!
          </p>
        </div>
      )}
    </div>
  );
}