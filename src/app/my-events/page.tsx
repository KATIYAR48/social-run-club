'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pwaUtils } from '@/lib/utils';

// Define the event type
interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    approved: boolean | null;
    checkedIn?: boolean;
    checkedInAt?: string | null;
}

export default function MyEventsPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [isEventsLoading, setIsEventsLoading] = useState(true);
    const router = useRouter();

    // Redirect if not authenticated (this is a backup to middleware)
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth?redirect=/my-events');
        }
    }, [isLoading, isAuthenticated, router]);

    // Fetch user's events
    useEffect(() => {
        if (isAuthenticated && user) {
            fetchUserEvents();
        }
    }, [isAuthenticated, user]);

    const fetchUserEvents = async (forceRefresh = false) => {
        try {
            setIsEventsLoading(true);

            // Add cache-busting parameter if force refresh is requested
            const baseUrl = '/api/user/events';
            const url = forceRefresh ? `${baseUrl}?t=${Date.now()}` : baseUrl;

            const response = await fetch(url, {
                headers: {
                    'Cache-Control': forceRefresh ? 'no-cache' : 'default',
                    'Pragma': forceRefresh ? 'no-cache' : 'default',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setEvents((data.events || []).sort((a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            } else {
                console.error('Failed to fetch events');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setIsEventsLoading(false);
        }
    };

    // Handle manual refresh
    const handleRefresh = async () => {
        await pwaUtils.clearEventsCache();
        fetchUserEvents(true);
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

    // Get status badge
    const getStatusBadge = (approved: boolean | null) => {
        if (approved === true) {
            return <span className="px-2 py-1 text-xs bg-green-900 text-green-300 border border-green-800">Approved</span>;
        } else if (approved === false) {
            return <span className="px-2 py-1 text-xs bg-red-900 text-red-300 border border-red-800">Declined</span>;
        } else {
            return <span className="px-2 py-1 text-xs bg-yellow-900 text-yellow-300 border border-yellow-800">Pending</span>;
        }
    };

    // Get check-in badge
    const getCheckInBadge = (checkedIn: boolean | undefined, approved: boolean | null) => {
        if (!approved) return null;

        if (checkedIn) {
            return <span className="px-2 py-1 text-xs bg-blue-900 text-blue-300 border border-blue-800 ml-2">Checked In</span>;
        }
        return null;
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                        <p className="mt-4">Loading...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-black text-white py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
                    >
                        <h1 className="text-3xl font-bold">My Events</h1>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRefresh}
                                disabled={isEventsLoading}
                                className="inline-flex items-center px-4 py-2 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
                            >
                                <svg className={`w-5 h-5 mr-2 ${isEventsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {isEventsLoading ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <Link
                                href="/qr-scanner"
                                className="inline-flex items-center px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                Scan QR Code
                            </Link>
                        </div>
                    </motion.div>

                    {isEventsLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : events.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            {events.map((event, index) => (
                                <motion.div
                                    key={event._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="bg-black border border-zinc-800 p-6"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold">{event.title}</h2>
                                            <p className="text-zinc-400 mt-1">{formatDate(event.date)}</p>
                                            <p className="text-zinc-400">{event.location}</p>
                                        </div>
                                        <div className="flex flex-col items-start md:items-end">
                                            <div className="flex flex-wrap gap-2">
                                                {getStatusBadge(event.approved)}
                                                {getCheckInBadge(event.checkedIn, event.approved)}
                                            </div>
                                            <Link
                                                href={`/events/${event._id}`}
                                                className="mt-3 text-sm text-white hover:underline"
                                            >
                                                View Event Details
                                            </Link>
                                            {event.approved === true && !event.checkedIn && (
                                                <p className="mt-2 text-sm text-zinc-400">
                                                    Check-in available at event venue
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-4 text-zinc-300">{event.description}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-black border border-zinc-800 p-8 text-center"
                        >
                            <h2 className="text-xl font-bold mb-4">You haven&apos;t registered for any events yet</h2>
                            <p className="text-zinc-400 mb-6">Check out our upcoming events and join the fun!</p>
                            <Link
                                href="/events"
                                className="px-6 py-3 bg-white text-black hover:bg-zinc-200 transition-colors inline-block border border-zinc-200"
                            >
                                Browse Events
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
} 