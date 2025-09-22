'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface DataRefreshIndicatorProps {
    lastUpdated: Date | null;
    onRefresh: () => void;
    loading?: boolean;
    className?: string;
}

export default function DataRefreshIndicator({
    lastUpdated,
    onRefresh,
    loading = false,
    className = ''
}: DataRefreshIndicatorProps) {
    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    };

    const isDataStale = () => {
        if (!lastUpdated) return true;
        const now = new Date();
        const diffInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
        return diffInMinutes > 2; // Consider data stale after 2 minutes (more aggressive)
    };

    return (
        <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
            {lastUpdated && (
                <span className={`${isDataStale() ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    Last updated: {formatTimeAgo(lastUpdated)}
                </span>
            )}

            <button
                onClick={onRefresh}
                disabled={loading}
                className={`p-1 rounded-full transition-colors ${loading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                title="Refresh data"
            >
                <RefreshCw
                    size={16}
                    className={loading ? 'animate-spin' : ''}
                />
            </button>


        </div>
    );
}
