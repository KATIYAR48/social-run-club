'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import Link from 'next/link';

interface FollowStatsProps {
    userId: string;
    username: string;
    initialStats?: { followers: number; following: number };
    onStatsUpdate?: (stats: { followers: number; following: number }) => void;
}

export default function FollowStats({
    userId,
    username,
    initialStats,
    onStatsUpdate
}: FollowStatsProps) {
    const [stats, setStats] = useState(initialStats || { followers: 0, following: 0 });
    const [loading, setLoading] = useState(!initialStats);

    useEffect(() => {
        if (!initialStats) {
            fetchStats();
        }
    }, [userId, initialStats]);

    useEffect(() => {
        if (onStatsUpdate) {
            onStatsUpdate(stats);
        }
    }, [stats, onStatsUpdate]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/user/${userId}/follow-status`);
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching follow stats:', error);
        } finally {
            setLoading(false);
        }
    };



    if (loading) {
        return (
            <div className="flex gap-6 text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-6 text-sm">
            <Link
                href={`/profile/${username}/followers`}
                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
                <Users size={14} />
                <span>
                    <strong className="text-white">{stats.followers}</strong> followers
                </span>
            </Link>

            <Link
                href={`/profile/${username}/following`}
                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
                <Users size={14} />
                <span>
                    <strong className="text-white">{stats.following}</strong> following
                </span>
            </Link>
        </div>
    );
}

// Export the updateStats function for external use
export { FollowStats }; 