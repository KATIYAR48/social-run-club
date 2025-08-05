'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import { Card, Title, Legend, AreaChart } from '@tremor/react';
import tremorTheme from '@/lib/tremor-theme';
import { motion } from 'framer-motion';
import { Share2, Copy, Calendar, MapPin, Users, Trophy, Clock, CheckCircle } from 'lucide-react';
import { calculateAgeFromDateOfBirth } from '@/lib/utils';
import NotificationPrompt from '@/components/NotificationPrompt';
import FollowButton from '@/components/FollowButton';
import FollowStats from '@/components/FollowStats';
import ThreeJsRunner from '@/components/ThreeJsRunner';
import Link from 'next/link';
import CityScapeSection from '@/components/CityScapeSection';

// Error boundary component for ThreeJsRunner
function ThreeJsRunnerWithFallback({ gender }: { gender: 'male' | 'female' }) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <div className="bg-zinc-800 h-32 w-32 flex items-center justify-center text-4xl font-bold border border-zinc-700 rounded-lg">
                {gender === 'male' ? '🏃‍♂️' : '🏃‍♀️'}
            </div>
        );
    }

    return (
        <div onError={() => setHasError(true)}>
            <ThreeJsRunner gender={gender} />
        </div>
    );
}

interface PublicProfile {
    _id: string;
    name: string;
    username: string;
    joinDate: string;
    role: string;
    dateOfBirth?: string;
    age?: number;
    gender?: string;
    instagramUsername?: string;
    joinCrew?: boolean;
    email?: string;
    phone?: string;
    emergencyContact?: string;
    stats: {
        totalEvents: number;
        upcomingEvents: number;
        completedEvents: number;
    };
    events: {
        approved: Array<{
            _id: string;
            event: {
                _id: string;
                title: string;
                description: string;
                date: string;
                location: string;
            };
            checkedIn: boolean;
            checkedInAt?: string;
            registeredAt: string;
        }>;
        pending?: Array<{
            _id: string;
            event: {
                _id: string;
                title: string;
                description: string;
                date: string;
                location: string;
            };
            registeredAt: string;
        }>;
    };
    isOwnProfile: boolean;
}

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
    const [statusChartData, setStatusChartData] = useState<Array<{
        month: string;
        registered: number;
        approved: number;
    }>>([]);

    const username = params.username as string;

    useEffect(() => {
        if (username) {
            fetchProfile();
        }
    }, [username]);

    // Prepare chart data when profile is loaded (for all users)
    useEffect(() => {
        if (profile && profile.events.approved.length > 0) {
            // Prepare monthly timeline data
            const monthlyData: Record<string, { registered: number, approved: number }> = {};

            // Initialize last 6 months
            const today = new Date();
            for (let i = 5; i >= 0; i--) {
                const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthKey = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                monthlyData[monthKey] = { registered: 0, approved: 0 };
            }

            // Count events by month - we only have approved events in the public profile API
            profile.events.approved.forEach(userEvent => {
                const eventDate = new Date(userEvent.event.date);
                const monthKey = eventDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].registered += 1; // All events in approved are registered
                    monthlyData[monthKey].approved += 1;   // All events in approved are approved
                }
            });

            // Add pending events if available (also count as registered but not approved)
            if (profile.events.pending) {
                profile.events.pending.forEach(userEvent => {
                    const eventDate = new Date(userEvent.event.date);
                    const monthKey = eventDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

                    if (monthlyData[monthKey]) {
                        monthlyData[monthKey].registered += 1; // Pending events are registered
                        // Don't increment approved for pending events
                    }
                });
            }

            // Convert to array for chart
            const timelineData = Object.entries(monthlyData).map(([month, data]) => ({
                month,
                registered: data.registered,
                approved: data.approved
            }));

            setStatusChartData(timelineData);
        }
    }, [profile]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/profile/${username}`);
            const data = await response.json();

            if (data.success) {
                setProfile(data.profile);
            } else {
                setError(data.message || 'Profile not found');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        const profileUrl = `${window.location.origin}/profile/${username}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profile?.name}'s Cloka Profile`,
                    text: `Check out ${profile?.name}'s running profile on Cloka!`,
                    url: profileUrl,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback to clipboard
            copyToClipboard(profileUrl);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleLogout = async () => {
        if (user) {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                // Refresh the page to redirect user to auth
                window.location.href = '/auth';
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
                        <p className="text-zinc-400">Loading profile...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !profile) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Profile Not Found</h1>
                        <p className="text-zinc-400 mb-8">{error}</p>
                        <Button onClick={() => router.push('/')}>
                            Go Home
                        </Button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const displayedEvents = showUpcomingOnly
        ? profile.events.approved.filter(event => new Date(event.event.date) >= new Date())
        : profile.events.approved;

    return (
        <section>
            <div className='max-w-7xl mx-auto'>
                <Header />
                <div className="min-h-screen bg-black text-white">
                    <div className="container mx-auto px-4 py-8">
                        {/* Profile Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="border border-zinc-800 p-8 mb-8"
                        >
                            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                                {/* Avatar */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                >
                                    <ThreeJsRunnerWithFallback gender={profile.gender?.toLowerCase() === 'female' ? 'female' : 'male'} />
                                </motion.div>
                                {/* <div className="bg-zinc-800 h-32 w-32 flex items-center justify-center text-4xl font-bold border border-zinc-700">
                                {profile.name.charAt(0).toUpperCase()}
                            </div> */}


                                {/* Profile Info */}
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h1 className="text-3xl font-bold">{profile.name}</h1>
                                            <p className="text-zinc-400 text-lg">@{profile.username}</p>
                                            {profile.role === 'admin' && (
                                                <span className="inline-block mt-2 px-3 py-1 bg-white text-black text-xs font-semibold rounded">
                                                    Admin
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-3">
                                            <Button
                                                onClick={handleShare}
                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                                            >
                                                <Share2 size={16} />
                                                Share
                                            </Button>

                                            <Button
                                                onClick={() => copyToClipboard(`${window.location.origin}/profile/${username}`)}
                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                                            >
                                                <Copy size={16} />
                                                {copied ? 'Copied!' : 'Copy Link'}
                                            </Button>

                                            {profile.isOwnProfile && (
                                                <Button
                                                    onClick={() => router.push('/profile/edit')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-zinc-600 hover:bg-zinc-700"
                                                >
                                                    Edit Profile
                                                </Button>
                                            )}

                                            <FollowButton
                                                userId={profile._id}
                                                isOwnProfile={profile.isOwnProfile}
                                            />
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
                                        <FollowStats
                                            userId={profile._id}
                                            username={profile.username}
                                        />
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            Joined {formatDate(profile.joinDate)}
                                        </div>
                                        {(profile.age || profile.dateOfBirth) && (
                                            <div className="flex items-center gap-1">
                                                <Users size={14} />
                                                {profile.age || (profile.dateOfBirth ? calculateAgeFromDateOfBirth(profile.dateOfBirth) : null)} years old
                                            </div>
                                        )}
                                        {profile.instagramUsername && (
                                            <div className="flex items-center gap-1">
                                                <span>📸</span>
                                                <a
                                                    href={`https://instagram.com/${profile.instagramUsername}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-white transition-colors"
                                                >
                                                    @{profile.instagramUsername}
                                                </a>
                                            </div>
                                        )}

                                    </div>

                                    {/* Private Info (Only for profile owner) */}
                                    {profile.isOwnProfile && (
                                        <div className="mt-4 pt-2 border-t border-zinc-800">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                {profile.email && (
                                                    <div>
                                                        <span className="text-zinc-500">Email:</span>
                                                        <span className="ml-2">{profile.email}</span>
                                                    </div>
                                                )}
                                                {profile.phone && (
                                                    <div>
                                                        <span className="text-zinc-500">Phone:</span>
                                                        <span className="ml-2">{profile.phone}</span>
                                                    </div>
                                                )}
                                                {profile.emergencyContact && (
                                                    <div>
                                                        <span className="text-zinc-500">Emergency Contact:</span>
                                                        <span className="ml-2">{profile.emergencyContact}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>


                        {/* Strava Stats - Only for own profile */}
                        {/* {profile.isOwnProfile && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="mb-8"
                        >
                            <div className="border border-zinc-800 p-6">
                                <StravaStats user={profile} />
                            </div>
                        </motion.div>
                    )} */}

                        {/* NotificationPrompt - Only for own profile */}
                        {profile.isOwnProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.15 }}
                                className="mb-8"
                            >
                                <NotificationPrompt className="" />
                            </motion.div>
                        )}

                        {/* Event Participation Timeline Chart - For all users */}
                        {statusChartData.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="mb-8"
                            >
                                <style jsx global>{`
                                .recharts-text {
                                    fill: white !important;
                                }
                                .recharts-cartesian-axis-tick-value {
                                    fill: white !important;
                                }
                                .recharts-legend-item-text {
                                    color: white !important;
                                }
                            `}</style>
                                <Card className="border border-zinc-800 p-6" style={{ color: tremorTheme.colors.content }}>
                                    <Title className="text-white mb-4 text-lg font-bold">Event Participation Timeline</Title>
                                    <div className="text-white text-sm mb-2">
                                        {profile.isOwnProfile
                                            ? "Track your event participation over the last 6 months"
                                            : `${profile.name}'s event participation over the last 6 months`
                                        }
                                    </div>
                                    <div className="[&_text]:!text-white [&_tspan]:!text-white [&_.recharts-cartesian-axis-tick-value]:!fill-white">
                                        <AreaChart
                                            data={statusChartData}
                                            index="month"
                                            categories={["registered", "approved"]}
                                            colors={["#ffffff", "#10b981"]}
                                            className="h-72 mt-4 text-white"
                                            showAnimation={true}
                                            valueFormatter={(value) => `${value}`}
                                            showLegend={false}
                                            showGridLines={false}
                                            showXAxis={true}
                                            showYAxis={true}
                                            yAxisWidth={30}
                                            connectNulls={true}
                                            curveType="monotone"
                                            customTooltip={(props) => (
                                                <div className="bg-zinc-900 border border-zinc-800 p-2 shadow-lg">
                                                    <p className="text-white font-medium">{props.payload?.[0]?.payload.month}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="w-3 h-3 bg-white"></span>
                                                        <span className="text-zinc-300">Registered: {props.payload?.[0]?.value}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="w-3 h-3 bg-emerald-500"></span>
                                                        <span className="text-zinc-300">Approved: {props.payload?.[1]?.value}</span>
                                                    </div>
                                                </div>
                                            )}
                                            style={{
                                                '--tr-color-axis': '#71717a',
                                                '--tr-color-tick': '#d4d4d8',
                                                '--tr-color-label': '#ffffff',
                                                '--tr-color-stroke': '#ffffff',
                                                '--tr-color-stroke-width': '2px',
                                                color: 'white',
                                            } as React.CSSProperties}
                                        />
                                    </div>
                                    <div className="mt-6 flex justify-center">
                                        <Legend
                                            categories={["Registered", "Approved"]}
                                            colors={["#ffffff", "#10b981"]}
                                            className="text-zinc-300"
                                        />
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {/* Stats Cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                        >
                            <div className="border border-zinc-800 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-zinc-800 p-3">
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{profile.stats.totalEvents}</p>
                                        <p className="text-zinc-400">Total Events</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-zinc-800 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-zinc-800 p-3">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{profile.stats.upcomingEvents}</p>
                                        <p className="text-zinc-400">Upcoming Events</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-zinc-800 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-zinc-800 p-3">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{profile.stats.completedEvents}</p>
                                        <p className="text-zinc-400">Completed Events</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Events Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="border border-zinc-800 p-6"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                                <h2 className="text-2xl font-bold">Events</h2>

                                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="showUpcoming"
                                            checked={showUpcomingOnly}
                                            onChange={(e) => setShowUpcomingOnly(e.target.checked)}
                                            className="rounded border-zinc-700 bg-zinc-800"
                                        />
                                        <label htmlFor="showUpcoming" className="text-sm text-zinc-400">
                                            Show upcoming only
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {displayedEvents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Clock size={48} className="mx-auto mb-4 text-zinc-600" />
                                    <p className="text-zinc-400">No events to display</p>
                                </div>
                            ) : (
                                <div className="space-y-4 overflow-y-auto max-h-[500px]">
                                    {displayedEvents.map((userEvent) => {
                                        const isUpcoming = new Date(userEvent.event.date) >= new Date();
                                        return (
                                            <div key={userEvent._id} className="bg-zinc-900/50 border border-zinc-700  p-6">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <Link href={`/events/${userEvent.event._id}`}>
                                                            <h3 className="text-lg hover:underline font-semibold mb-2">{userEvent.event.title}</h3>
                                                        </Link>

                                                        <p className="text-zinc-400 mb-3">{userEvent.event.description}</p>

                                                        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar size={14} />
                                                                {formatDate(userEvent.event.date)} at {formatTime(userEvent.event.date)}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <MapPin size={14} />
                                                                {userEvent.event.location}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock size={14} />
                                                                Registered {formatDate(userEvent.registeredAt)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isUpcoming
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-green-600 text-white'
                                                            }`}>
                                                            {isUpcoming ? 'Upcoming' : 'Completed'}
                                                        </div>

                                                        {userEvent.checkedIn && (
                                                            <div className="flex items-center gap-1 text-green-400 text-xs">
                                                                <CheckCircle size={12} />
                                                                Checked In
                                                                {userEvent.checkedInAt && (
                                                                    <span className="text-zinc-500">
                                                                        at {formatTime(userEvent.checkedInAt)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pending Events (Only for profile owner) */}
                            {profile.isOwnProfile && profile.events.pending && profile.events.pending.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-zinc-800">
                                    <h3 className="text-xl font-semibold mb-4">Pending Approval</h3>
                                    <div className="space-y-4">
                                        {profile.events.pending.map((userEvent) => (
                                            <div key={userEvent._id} className="bg-zinc-900 border border-zinc-600 p-6">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <Link href={`/events/${userEvent.event._id}`}>
                                                            <h4 className="text-lg hover:underline font-semibold mb-2">{userEvent.event.title}</h4>
                                                        </Link>
                                                        <p className="text-zinc-400 mb-3">{userEvent.event.description}</p>

                                                        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar size={14} />
                                                                {formatDate(userEvent.event.date)} at {formatTime(userEvent.event.date)}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <MapPin size={14} />
                                                                {userEvent.event.location}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="px-3 py-1 rounded-full bg-yellow-600 text-black text-xs font-semibold">
                                                        Pending Approval
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Account Settings - Only for own profile */}
                        {profile.isOwnProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="mt-8 bg-zinc-900/80 border border-zinc-800 p-6"
                            >
                                <h2 className="text-xl font-bold mb-4">Account Settings</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Button
                                        variant="primary"
                                        className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
                                        onClick={() => router.push('/profile/edit')}
                                    >
                                        Edit Profile
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
                                        onClick={() => router.push('/profile/change-password')}
                                    >
                                        Change Password
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="w-full py-2 px-4 bg-red-900 hover:bg-red-800 transition-colors border border-red-800"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

            </div>
            <CityScapeSection />
            <Footer />
        </section>
    );
} 