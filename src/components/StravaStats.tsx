'use client';

import { useState } from 'react';

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