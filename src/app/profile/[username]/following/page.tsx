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

interface Following {
    _id: string;
    username: string;
    name: string;
    followedAt: string;
}

interface FollowingResponse {
    success: boolean;
    following: Following[];
    count: number;
    message?: string;
}

export default function FollowingPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const username = params?.username as string;

    const [following, setFollowing] = useState<Following[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<{ isOwnProfile?: boolean; name?: string } | null>(null);

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

    const fetchFollowing = useCallback(async () => {
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

            const response = await fetch(`/api/user/${userId}/following`);
            const data: FollowingResponse = await response.json();

            if (data.success) {
                setFollowing(data.following);
            } else {
                setError(data.message || 'Failed to load following');
            }
        } catch (error) {
            console.error('Error fetching following:', error);
            setError('Failed to load following');
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        if (username) {
            fetchFollowing();
            fetchUserProfile();
        }
    }, [username, fetchFollowing, fetchUserProfile]);

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
                        <p className="text-zinc-400">Loading following...</p>
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
                            <h1 className="text-4xl font-bold">Following</h1>
                            {userProfile && (
                                <p className="text-zinc-400">
                                    People <Link href={`/profile/${username}`} className="text-white hover:underline">@{username}</Link> is following
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Following List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {following.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-zinc-600 mb-4">
                                <Users size={48} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Not following anyone yet</h3>
                            <p className="text-zinc-400">
                                {userProfile?.isOwnProfile
                                    ? "Discover and follow other runners to see their activities!"
                                    : `${userProfile?.name || username} isn't following anyone yet.`
                                }
                            </p>
                            {userProfile?.isOwnProfile && (
                                <div className="mt-6">
                                    <Link href="/feed">
                                        <Button>Explore Feed</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="mb-6">
                                <p className="text-zinc-400">
                                    Following {following.length} user{following.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {following.map((followedUser) => (
                                <motion.div
                                    key={followedUser._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="border border-zinc-800 p-6 hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <Link href={`/profile/${followedUser.username}`}>
                                                <div className="bg-zinc-800 h-12 w-12 flex items-center justify-center text-lg font-bold border border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer">
                                                    {followedUser.name.charAt(0).toUpperCase()}
                                                </div>
                                            </Link>

                                            {/* User Info */}
                                            <div>
                                                <Link
                                                    href={`/profile/${followedUser.username}`}
                                                    className="font-semibold text-lg hover:text-zinc-300 transition-colors"
                                                >
                                                    {followedUser.name}
                                                </Link>
                                                <p className="text-zinc-400">@{followedUser.username}</p>
                                                <p className="text-sm text-zinc-500">
                                                    Following since {formatDate(followedUser.followedAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Follow Button */}
                                        <div className="flex items-center gap-3">
                                            <FollowButton
                                                userId={followedUser._id}
                                                isOwnProfile={user?._id === followedUser._id}
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