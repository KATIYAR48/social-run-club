'use client';

import { useState } from 'react';
import StravaQuotaExceeded from './StravaQuotaExceeded';

interface StravaStatsProps {
    user: {
        _id: string;
        strava?: {
            connected?: boolean;
            stats?: {
                fastest5k?: { time: number; date: Date };
                fastest10k?: { time: number; date: Date };
                fastestHalfMarathon?: { time: number; date: Date };
                fastestMarathon?: { time: number; date: Date };
                longestRun?: { distance: number; date: Date };
                weeklyDistance?: number;
                weeklyElevation?: number;
                monthlyDistance?: number;
                monthlyRuns?: number;
                yearlyDistance?: number;
                totalDistance?: number;
                totalRuns?: number;
                totalElevation?: number;
                achievements?: Array<{
                    type: string;
                    title: string;
                    description: string;
                    unlockedAt: Date;
                    value: number;
                }>;
                currentStreak?: number;
                longestStreak?: number;
                lastActivityDate?: Date;
                lastUpdated?: Date;
            };
        };
    };
}

export default function StravaStats({ user }: StravaStatsProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quotaExceeded, setQuotaExceeded] = useState(false);

    const refreshStats = async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            const response = await fetch('/api/strava/refresh-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to refresh stats');
            }

            // Refresh the page or update state
            window.location.reload();
        } catch (error) {
            console.error('Error refreshing stats:', error);
            if (error instanceof Error) {
                if (error.message.includes('quota exceeded')) {
                    setQuotaExceeded(true);
                    setError('Strava quota exceeded. Please contact support for quota increase.');
                } else if (error.message.includes('rate limit')) {
                    setError('Rate limit exceeded. Please try again later.');
                } else {
                    setError('Failed to refresh stats. Please try again.');
                }
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDistance = (meters: number) => {
        return (meters / 1000).toFixed(2) + ' km';
    };

    if (!user.strava?.connected) {
        return (
            <div className="bg-orange-500 text-white p-4">
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

    // Show quota exceeded fallback if needed
    if (quotaExceeded) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Your Running Stats</h2>
                </div>
                <StravaQuotaExceeded onRetry={() => setQuotaExceeded(false)} />
            </div>
        );
    }

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

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Personal Records */}
            <div className="p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Personal Records 🏆</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {stats?.fastest5k ? formatTime(stats.fastest5k.time) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">5K PR</div>
                    </div>
                    {stats?.fastest10k ? (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {stats.fastest10k ? formatTime(stats.fastest10k.time) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">10K PR</div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                N/A
                            </div>
                            <div className="text-sm text-gray-600">10K PR</div>
                        </div>
                    )}
                    {stats?.fastestHalfMarathon ? (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {stats.fastestHalfMarathon ? formatTime(stats.fastestHalfMarathon.time) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">Half Marathon PR</div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                N/A
                            </div>
                            <div className="text-sm text-gray-600">Half Marathon PR</div>
                        </div>
                    )}
                    {stats?.longestRun ? (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-500">
                                {stats.longestRun ? formatDistance(stats.longestRun.distance) : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">Longest Run</div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                N/A
                            </div>
                            <div className="text-sm text-gray-600">Longest Run</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Current Stats */}
            <div className="p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Current Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">
                            {stats?.currentStreak || 0}
                        </div>
                        <div className="text-sm text-gray-600">Current Streak</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">
                            {formatDistance(stats?.weeklyDistance || 0)}
                        </div>
                        <div className="text-sm text-gray-600">This Week</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">
                            {formatDistance(stats?.monthlyDistance || 0)}
                        </div>
                        <div className="text-sm text-gray-600">This Month</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">
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
                        {stats.achievements.map((achievement, index: number) => (
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