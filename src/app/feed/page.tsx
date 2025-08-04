'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import { motion } from 'framer-motion';
import { Calendar, MapPin, CheckCircle, Users, Globe } from 'lucide-react';
import Link from 'next/link';

interface FeedActivity {
    _id: string;
    type: 'check-in';
    user: {
        _id: string;
        username: string;
        name: string;
    };
    event: {
        _id: string;
        title: string;
        description: string;
        date: string;
        location: string;
    };
    checkedInAt: string;
    createdAt: string;
}

interface FeedResponse {
    success: boolean;
    activities: FeedActivity[];
    totalCount: number;
    hasMore: boolean;
    feedType: string;
    message?: string;
}

export default function FeedPage() {
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<'global' | 'following'>('global');
    const [activities, setActivities] = useState<FeedActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadFeed = useCallback(async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
                setError(null);
            } else {
                setLoadingMore(true);
            }

            const offset = reset ? 0 : activities.length;
            const response = await fetch(`/api/feed?type=${activeTab}&limit=20&offset=${offset}`);
            const data: FeedResponse = await response.json();

            if (data.success) {
                if (reset) {
                    setActivities(data.activities);
                } else {
                    setActivities(prev => [...prev, ...data.activities]);
                }
                setHasMore(data.hasMore);
            } else {
                setError(data.message || 'Failed to load feed');
            }
        } catch (error) {
            console.error('Error loading feed:', error);
            setError('Failed to load feed');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeTab, activities.length]);

    useEffect(() => {
        loadFeed(true);
    }, [loadFeed]);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    const formatEventDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleTabChange = (tab: 'global' | 'following') => {
        if (tab === 'following' && !isAuthenticated) {
            // Redirect to auth if trying to access following feed without authentication
            window.location.href = '/auth';
            return;
        }
        setActiveTab(tab);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold mb-4">See what the community is upto!</h1>
                    <p className="text-zinc-400">Stay connected with the latest check-ins and activities from the Cloka community</p>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="flex border-b border-zinc-800">
                        <button
                            onClick={() => handleTabChange('global')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === 'global'
                                ? 'border-white text-white'
                                : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                        >
                            <Globe size={20} />
                            Global Feed
                        </button>
                        <button
                            onClick={() => handleTabChange('following')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === 'following'
                                ? 'border-white text-white'
                                : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                        >
                            <Users size={20} />
                            Following
                            {!isAuthenticated && (
                                <span className="text-xs bg-zinc-700 px-2 py-1 rounded">Login Required</span>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Feed Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                                <p className="text-zinc-400">Loading feed...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <p className="text-red-400 mb-4">{error}</p>
                            <Button onClick={() => loadFeed(true)}>
                                Try Again
                            </Button>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-16">
                            <div className="text-zinc-600 mb-4">
                                {activeTab === 'following' ? <Users size={48} /> : <Globe size={48} />}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No activities yet</h3>
                            <p className="text-zinc-400 mb-6">
                                {activeTab === 'following'
                                    ? "Follow some users to see their check-ins here!"
                                    : "Be the first to check in to an event!"}
                            </p>
                            <Link href="/events">
                                <Button>Explore Events</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activities.map((activity) => (
                                <motion.div
                                    key={activity._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* User Avatar */}
                                        <div className="bg-zinc-800 h-12 w-12 flex items-center justify-center text-lg font-bold border border-zinc-700 flex-shrink-0">
                                            {activity.user.name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Activity Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Link
                                                    href={`/profile/${activity.user.username}`}
                                                    className="font-semibold hover:text-zinc-300 transition-colors"
                                                >
                                                    {activity.user.name}
                                                </Link>
                                                <span className="text-zinc-500">@{activity.user.username}</span>
                                                <span className="text-zinc-600">•</span>
                                                <span className="text-zinc-500 text-sm">{formatTimeAgo(activity.checkedInAt)}</span>
                                            </div>

                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle size={16} className="text-green-500" />
                                                <span className="text-zinc-300">checked in to</span>
                                            </div>

                                            {/* Event Info */}
                                            <Link
                                                href={`/events/${activity.event._id}`}
                                                className="block bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
                                            >
                                                <h4 className="font-semibold text-lg mb-2 hover:text-zinc-300">
                                                    {activity.event.title}
                                                </h4>
                                                <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                                                    {activity.event.description}
                                                </p>
                                                <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {formatEventDate(activity.event.date)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={14} />
                                                        {activity.event.location}
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="text-center pt-6">
                                    <Button
                                        onClick={() => loadFeed(false)}
                                        disabled={loadingMore}
                                        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                                    >
                                        {loadingMore ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Loading...
                                            </div>
                                        ) : (
                                            'Load More'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            <Footer />
        </div>
    );
} 