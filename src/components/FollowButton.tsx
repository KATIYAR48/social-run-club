'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Button from '@/components/Button';
import { UserPlus, UserMinus } from 'lucide-react';
import Loader from "@/components/ui/PixelLoader"

interface FollowButtonProps {
    userId: string;
    isOwnProfile?: boolean;
    onFollowChange?: (isFollowing: boolean, stats: { followers: number; following: number }) => void;
}

export default function FollowButton({
    userId,
    isOwnProfile = false,
    onFollowChange
}: FollowButtonProps) {
    const { isAuthenticated } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
    const [statusLoaded, setStatusLoaded] = useState(false);

    useEffect(() => {
        if (userId && !isOwnProfile) {
            fetchFollowStatus();
        }
    }, [userId, isOwnProfile]);

    const fetchFollowStatus = async () => {
        try {
            const response = await fetch(`/api/user/${userId}/follow-status`);
            const data = await response.json();

            if (data.success) {
                setIsFollowing(data.isFollowing);
                setFollowStats(data.stats);
                setStatusLoaded(true);

                // Notify parent component about the stats
                if (onFollowChange) {
                    onFollowChange(data.isFollowing, data.stats);
                }
            }
        } catch (error) {
            console.error('Error fetching follow status:', error);
        }
    };

    const handleFollowToggle = async () => {
        if (!isAuthenticated) {
            // Redirect to auth if not authenticated
            window.location.href = '/auth';
            return;
        }

        if (isLoading) return;

        setIsLoading(true);

        try {
            const action = isFollowing ? 'unfollow' : 'follow';
            const response = await fetch('/api/user/follow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    action
                }),
            });

            const data = await response.json();

            if (data.success) {
                const newIsFollowing = action === 'follow';
                setIsFollowing(newIsFollowing);

                // Update stats optimistically
                const newStats = {
                    followers: followStats.followers + (newIsFollowing ? 1 : -1),
                    following: followStats.following
                };
                setFollowStats(newStats);

                // Notify parent component
                if (onFollowChange) {
                    onFollowChange(newIsFollowing, newStats);
                }
            } else {
                console.error('Follow action failed:', data.message);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Don't show button for own profile
    if (isOwnProfile) {
        return null;
    }

    // Don't show button until we've loaded the status
    if (!statusLoaded) {
        return null;
    }

    return (
        <Button
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 transition-all ${isFollowing
                ? 'bg-zinc-800 hover:bg-red-600 border border-zinc-700 hover:border-red-600'
                : 'border border-zinc-300 text-black hover:bg-zinc-900'
                }`}
        >
            {isLoading ? (
                <Loader size='sm' />
            ) : isFollowing ? (
                <>
                    <UserMinus size={16} />
                    Unfollow
                </>
            ) : (
                <>
                    <UserPlus size={16} />
                    Follow
                </>
            )}
        </Button>
    );
} 