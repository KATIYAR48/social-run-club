'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import FollowButton from '@/components/FollowButton';
import { motion } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

interface Follower {
    _id: string;
    username: string;
    name: string;
    followedAt: string;
}

interface FollowersResponse {
    success: boolean;
    followers: Follower[];
    count: number;
    message?: string;
}

export default function FollowersPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const username = params?.username as string;

    const [followers, setFollowers] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);

    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await fetch(`/api/profile/${username}`);
            const data = await response.json();
            if (data.success) {
                setUserProfile(data.profile);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }, [username]);

    const fetchFollowers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get user ID first
            const profileResponse = await fetch(`/api/profile/${username}`);
            const profileData = await profileResponse.json();

            if (!profileData.success) {
                setError('User not found');
                return;
            }

            const userId = profileData.profile._id;

            const response = await fetch(`/api/user/${userId}/followers`);
            const data: FollowersResponse = await response.json();

            if (data.success) {
                setFollowers(data.followers);
            } else {
                setError(data.message || 'Failed to load followers');
            }
        } catch (error) {
            console.error('Error fetching followers:', error);
            setError('Failed to load followers');
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        if (username) {
            fetchFollowers();
            fetchUserProfile();
        }
    }, [username, fetchFollowers, fetchUserProfile]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
                        <p className="text-zinc-400">Loading followers...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Error</h1>
                        <p className="text-zinc-400 mb-8">{error}</p>
                        <Button onClick={() => router.push(`/profile/${username}`)}>
                            Back to Profile
                        </Button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Header />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <Button
                            onClick={() => router.push(`/profile/${username}`)}
                            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-4xl font-bold">Followers</h1>
                            {userProfile && (
                                <p className="text-zinc-400">
                                    People following <Link href={`/profile/${username}`} className="text-white hover:underline">@{username}</Link>
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Followers List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {followers.length === 0 ? (
                        <div className="text-center flex-col items-center justify-center py-16">
                            <div className="text-zinc-600 mb-4 flex-col items-center justify-center">
                                <Users size={48} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No followers yet</h3>
                            <p className="text-zinc-400">
                                {userProfile?.isOwnProfile
                                    ? "Share your profile to get your first followers!"
                                    : `${userProfile?.name || username} doesn't have any followers yet.`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="mb-6">
                                <p className="text-zinc-400">
                                    {followers.length} follower{followers.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {followers.map((follower) => (
                                <motion.div
                                    key={follower._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <Link href={`/profile/${follower.username}`}>
                                                <div className="bg-zinc-800 h-12 w-12 flex items-center justify-center text-lg font-bold border border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
                                                    {follower.name.charAt(0).toUpperCase()}
                                                </div>
                                            </Link>

                                            {/* User Info */}
                                            <div>
                                                <Link
                                                    href={`/profile/${follower.username}`}
                                                    className="font-semibold text-lg hover:text-zinc-300 transition-colors"
                                                >
                                                    {follower.name}
                                                </Link>
                                                <p className="text-zinc-400">@{follower.username}</p>
                                                <p className="text-sm text-zinc-500">
                                                    Followed since {formatDate(follower.followedAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Follow Button */}
                                        <div className="flex items-center gap-3">
                                            <FollowButton
                                                userId={follower._id}
                                                isOwnProfile={user?._id === follower._id}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            <Footer />
        </div>
    );
} 