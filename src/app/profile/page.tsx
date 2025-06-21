'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Link from 'next/link';
import { Card, Title, Legend, AreaChart } from '@tremor/react';
import tremorTheme from '@/lib/tremor-theme';
import { motion } from 'framer-motion';

// Define event types
interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    approved: boolean | null;
}

interface AllEvent {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
}

// Chart data types
interface MonthlyData {
    month: string;
    registered: number;
    approved: number;
}

// Perks JSON (edit this array to add/remove perks)
const clokaPerks = [
    {
        name: 'Bask Café',
        description: '10% to all cloka members on showing their cloka profile at the counter. *Offer valid only during offical cloka event days.',
        image: '/bask.png', // Optionally add an image URL here
        link: 'https://www.baskcafe.com', // Optionally add a link to the partner
    },
];

export default function ProfilePage() {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [userEvents, setUserEvents] = useState<Event[]>([]);
    const [allEvents, setAllEvents] = useState<AllEvent[]>([]);
    const [isEventsLoading, setIsEventsLoading] = useState(true);
    const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);
    const [displayedEvents, setDisplayedEvents] = useState<AllEvent[]>([]);
    const [statusChartData, setStatusChartData] = useState<MonthlyData[]>([]);

    // Redirect if not authenticated (this is a backup to middleware)
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth');
        }
    }, [isLoading, isAuthenticated, router]);

    // Fetch user's events and all events
    useEffect(() => {
        if (isAuthenticated && user) {
            fetchUserEvents();
            fetchAllEvents();
        }
    }, [isAuthenticated, user]);

    // Update displayed events when filters change
    useEffect(() => {
        if (allEvents.length > 0) {
            const now = new Date();
            let filtered = allEvents;

            // Filter by date if showing upcoming only
            if (showUpcomingOnly) {
                filtered = filtered.filter(event => new Date(event.date) >= now);
            }

            // Filter to show only approved events from userEvents
            filtered = filtered.filter(event => {
                const userEvent = userEvents.find(ue => ue._id.toString() === event._id.toString());
                return userEvent?.approved === true;
            });

            setDisplayedEvents(filtered);
        }
    }, [allEvents, showUpcomingOnly, userEvents]);

    // Prepare chart data when user events change
    useEffect(() => {
        if (userEvents.length > 0) {
            // Prepare monthly timeline data
            const monthlyData: Record<string, { registered: number, approved: number }> = {};

            // Initialize last 6 months
            const today = new Date();
            for (let i = 5; i >= 0; i--) {
                const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthKey = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                monthlyData[monthKey] = { registered: 0, approved: 0 };
            }

            // Count events by month
            userEvents.forEach(event => {
                const eventDate = new Date(event.date);
                const monthKey = eventDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].registered += 1;
                    if (event.approved === true) {
                        monthlyData[monthKey].approved += 1;
                    }
                }
            });

            // Convert to array for chart
            const timelineData = Object.entries(monthlyData).map(([month, data]) => ({
                month,
                registered: data.registered,
                approved: data.approved
            }));

            setStatusChartData(timelineData);
        }
    }, [userEvents]);

    const fetchUserEvents = async () => {
        try {
            const response = await fetch('/api/user/events');
            if (response.ok) {
                const data = await response.json();
                setUserEvents(data.events || []);
            } else {
                console.error('Failed to fetch user events');
            }
        } catch (error) {
            console.error('Error fetching user events:', error);
        }
    };

    const fetchAllEvents = async () => {
        try {
            setIsEventsLoading(true);
            const response = await fetch('/api/events?all=true');
            if (response.ok) {
                const data = await response.json();
                setAllEvents(data.events || []);
            } else {
                console.error('Failed to fetch all events');
            }
        } catch (error) {
            console.error('Error fetching all events:', error);
        } finally {
            setIsEventsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <div className="animate-spin h-16 w-16 border-4 border-zinc-800 border-t-white rounded-full"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="h-8 w-8 bg-black rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-lg font-medium text-zinc-400">Loading your dashboard...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
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
            <div className="min-h-screen bg-black text-white py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold mb-8"
                    >
                        Cloka Dashboard
                    </motion.h1>

                    {user && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-black border border-zinc-800 p-6 mb-8"
                        >
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                <div className="bg-zinc-900 h-24 w-24 flex items-center justify-center text-3xl font-bold border border-zinc-800">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold">{user.name}</h2>
                                    <p className="text-zinc-400">{user.email}</p>
                                    {user.role === 'admin' && (
                                        <span className="inline-block mt-2 px-3 py-1 bg-white text-black text-xs font-semibold">
                                            Admin
                                        </span>
                                    )}
                                </div>

                                <div className="ml-auto flex flex-col items-end">
                                    <div className="text-end">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-3xl font-bold text-white">{userEvents.length}</span>
                                            <span className="text-lg text-zinc-400">/ {allEvents.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between w-48">
                                            <p className="text-sm text-zinc-400">Events Joined</p>
                                        </div>
                                        <div className="w-48 h-2 bg-zinc-900 overflow-hidden mt-1 border border-zinc-800">
                                            <div
                                                className="h-full bg-white"
                                                style={{
                                                    width: `${allEvents.length ? (userEvents.length / allEvents.length) * 100 : 0}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Charts Section */}
                    {userEvents.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mb-8"
                        >
                            <Card className="bg-black border border-zinc-800 p-6" style={{ color: tremorTheme.colors.content }}>
                                <Title className="text-white mb-4 text-lg font-bold">Event Participation Timeline</Title>
                                <div className="text-white text-sm mb-2">
                                    Track your event participation over the last 6 months
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


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="md:col-span-1 bg-black border border-zinc-800 p-6"
                        >
                            <h2 className="text-xl font-bold mb-4">Account Settings</h2>
                            <div className="space-y-4">
                                <Button
                                    variant="primary"
                                    className="w-full py-2 px-4 bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800"
                                    onClick={() => router.push('/profile/edit')}
                                >
                                    Edit Profile
                                </Button>
                                <Button
                                    variant="primary"
                                    className="w-full py-2 px-4 bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800"
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

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="md:col-span-2 bg-black border border-zinc-800 p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Events you&apos;ve registered</h2>
                                <div className="inline-flex items-center bg-zinc-900 p-1 border border-zinc-800">
                                    <Button
                                        onClick={() => setShowUpcomingOnly(false)}
                                        variant={!showUpcomingOnly ? 'secondary' : 'primary'}
                                        size="small"
                                        className={`px-3 py-1 text-xs font-medium transition-colors ${!showUpcomingOnly
                                            ? 'bg-white text-black'
                                            : 'bg-transparent text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        All Events
                                    </Button>
                                    <Button
                                        onClick={() => setShowUpcomingOnly(true)}
                                        variant={showUpcomingOnly ? 'secondary' : 'primary'}
                                        size="small"
                                        className={`px-3 py-1 text-xs font-medium transition-colors ${showUpcomingOnly
                                            ? 'bg-white text-black'
                                            : 'bg-transparent text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        Upcoming Only
                                    </Button>
                                </div>
                            </div>

                            {isEventsLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="relative">
                                        <div className="animate-spin h-12 w-12 border-4 border-zinc-800 border-t-white rounded-full"></div>
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                            <div className="h-6 w-6 bg-black rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            ) : displayedEvents.length > 0 ? (
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                    {displayedEvents.map((event) => {
                                        // Check if this event is in the user's registered events
                                        const userEvent = userEvents.find(ue => ue._id.toString() === event._id.toString());
                                        const registered = !!userEvent;
                                        const status = userEvent ? userEvent.approved : null;

                                        return (
                                            <div
                                                key={event._id}
                                                className={`relative border p-5 transition-all ${registered
                                                    ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                                                    : 'bg-black border-zinc-800 hover:bg-zinc-900'
                                                    }`}
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-lg">{event.title}</h3>
                                                        {registered && (
                                                            <div className="ml-2">
                                                                <div className="bg-white text-black text-xs font-bold px-3 py-1 shadow-md">
                                                                    {status === true ? '✓ APPROVED' : status === false ? '✗ DECLINED' : '⟳ PENDING'}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-between items-end mt-2">
                                                        <div>
                                                            <p className="text-zinc-400 text-sm">{formatDate(event.date)}</p>
                                                            <p className="text-zinc-400 text-sm">{event.location}</p>
                                                            <p className="mt-2 text-sm text-zinc-300 line-clamp-2">{event.description}</p>
                                                        </div>
                                                        <div className="ml-4 flex-shrink-0">
                                                            <Link
                                                                href={`/events/${event._id}`}
                                                                className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 transition-colors whitespace-nowrap border border-zinc-700"
                                                            >
                                                                View Details
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-zinc-400 mb-4">No events found</p>
                                    <Link
                                        href="/events"
                                        className="px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-colors inline-block"
                                    >
                                        Browse All Events
                                    </Link>
                                </div>
                            )}

                            <div className="mt-6 text-center">
                                <Link
                                    href="/events"
                                    className="text-white hover:underline"
                                >
                                    View All Events
                                </Link>
                            </div>
                        </motion.div>
                    </div>


                    {/* Perks Section: Show if user joined > 5 events */}
                    {userEvents.length > 5 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                            className="mt-8"
                        >
                            <Card className="bg-black border border-zinc-800 p-6">
                                <Title className="text-xl mb-4 flex items-center gap-2">
                                    Cloka Perks
                                </Title>
                                <div className="text-zinc-300 mb-4">
                                    As a thank you for being an active Cloka runner, enjoy these exclusive perks from our affiliate partners!
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {clokaPerks.map((perk, idx) => (
                                        <div key={idx} className="border border-zinc-800 bg-white text-black p-4 flex flex-col items-start">
                                            <div className="flex justify-between w-full items-center gap-3 mb-2">
                                                <span className="font-bold text-3xl text-black">{perk.name}</span>
                                                {perk.image ? (
                                                    <img src={perk.image} alt={perk.name} className="w-12 h-12 object-cover rounded-full border border-zinc-800" />
                                                ) : (
                                                    <div className="w-12 h-12 flex items-center justify-center bg-white text-2xl border border-zinc-800">
                                                        🏅
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-black font-bold mb-2">{perk.description}</div>
                                            {perk.link && (
                                                <a href={perk.link} target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:underline text-sm">Learn More</a>
                                            )}
                                        </div>
                                    ))}
                                    <div className="border border-zinc-800 bg-zinc-900 text-zinc-500 p-4 flex flex-col items-start opacity-50">
                                        <div className="flex justify-between w-full items-center gap-3 mb-2">
                                            <span className="font-bold text-3xl">More perks incoming...</span>
                                            <div className="w-12 h-12 mb-4 flex items-center justify-center bg-zinc-800 text-2xl border border-zinc-700">
                                                🎁
                                            </div>
                                        </div>
                                        <div className="font-bold mb-2">Stay tuned for more exclusive perks from our partners!</div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                </div>
            </div>
            <Footer />
        </>
    );
} 