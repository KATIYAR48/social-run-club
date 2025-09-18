'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import Loader from '@/components/ui/PixelLoader';

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    autoApprove?: boolean;
}

export default function EventCheckInPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isEventsLoading, setIsEventsLoading] = useState(true);
    const [qrRefreshTimer, setQrRefreshTimer] = useState<number>(0);
    const [isQrRefreshing, setIsQrRefreshing] = useState(false);
    const [qrRefreshKey, setQrRefreshKey] = useState<number>(0);

    // Fetch events
    useEffect(() => {
        fetchEvents();
    }, []);

    const refreshQRCode = useCallback(async () => {
        if (!selectedEvent) return;

        setIsQrRefreshing(true);
        // Small delay to show the refresh animation
        await new Promise(resolve => setTimeout(resolve, 500));
        setQrRefreshKey(prev => prev + 1); // This will trigger QR code regeneration
        setIsQrRefreshing(false);
    }, [selectedEvent]);

    // Reset refresh key when event changes
    useEffect(() => {
        if (selectedEvent) {
            setQrRefreshKey(0);
        }
    }, [selectedEvent]);

    // QR Code auto-refresh functionality
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (selectedEvent) {
            // Start with 4 minutes (240 seconds) to refresh before 5-minute token expiry
            setQrRefreshTimer(240);

            interval = setInterval(() => {
                setQrRefreshTimer((prev) => {
                    if (prev <= 1) {
                        // Time to refresh the QR code
                        refreshQRCode();
                        return 240; // Reset to 4 minutes
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setQrRefreshTimer(0);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [selectedEvent, refreshQRCode]);

    const fetchEvents = async () => {
        try {
            setIsEventsLoading(true);
            const response = await fetch('/api/events?all=true');

            if (response.ok) {
                const data = await response.json();
                // Get the last 4 events (most recent first)
                const sortedEvents = data.events.sort((a: Event, b: Event) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                const lastFiveEvents = sortedEvents.slice(0, 4);
                setEvents(lastFiveEvents || []);
            } else {
                console.error('Failed to fetch events');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setIsEventsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const generateQRValue = useCallback((eventId: string) => {
        // Create a URL that will be used for check-in
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

        // Generate a secure token that includes the event ID and a timestamp
        // This token will expire after 5 minutes to prevent reuse
        const timestamp = Date.now();
        const tokenData = `${eventId}:${timestamp}`;

        // In a real app, you would use a proper encryption or signing method
        // For this example, we'll use a simple encoding
        const token = btoa(tokenData);

        return `${baseUrl}/check-in?eventId=${eventId}&token=${token}`;
    }, []);

    // Memoize the QR value so it only changes when refresh key changes
    const qrValue = useMemo(() => {
        if (!selectedEvent) return '';
        return generateQRValue(selectedEvent._id);
    }, [selectedEvent, qrRefreshKey, generateQRValue]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (isEventsLoading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <Loader />
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <div className="bg-black text-white py-12">
                <div className="max-w-6xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold mb-8"
                    >
                        Manage Event Check-Ins
                    </motion.h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-black border border-zinc-800 p-6"
                        >
                            <h2 className="text-xl font-bold mb-4">Select an Event</h2>
                            {events.length === 0 ? (
                                <p className="text-zinc-400">No events found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {events.map((event) => (
                                        <div
                                            key={event._id}
                                            className={`p-4 border transition-all cursor-pointer ${selectedEvent?._id === event._id
                                                ? 'border-white bg-zinc-900'
                                                : 'border-zinc-800 hover:border-zinc-700 bg-black'
                                                }`}
                                            onClick={() => setSelectedEvent(event)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium">{event.title}</h3>
                                                    <p className="text-sm text-zinc-400">{formatDate(event.date)}</p>
                                                    <p className="text-sm text-zinc-400">{event.location}</p>
                                                </div>
                                                {event.autoApprove && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300">
                                                        Auto-Approved
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-black border border-zinc-800 p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Check-In QR Code</h2>
                                {selectedEvent && qrRefreshTimer > 0 && (
                                    <div className="flex items-center space-x-2 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${qrRefreshTimer <= 30 ? 'bg-red-500' : qrRefreshTimer <= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                        <span className="text-zinc-400">
                                            Refreshes in {formatTime(qrRefreshTimer)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {selectedEvent ? (
                                <div className="flex flex-col items-center">
                                    <div className={`bg-white p-4 rounded-lg mb-4 transition-opacity duration-300 ${isQrRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                                        {isQrRefreshing ? (
                                            <div className="flex items-center justify-center">
                                                <Loader size='sm' text='Refreshing...' />
                                            </div>
                                        ) : (
                                            <QRCode
                                                value={qrValue}
                                                size={256}
                                            />
                                        )}
                                    </div>
                                    <p className="text-center mb-2 font-medium">{selectedEvent.title}</p>
                                    <p className="text-center text-sm text-zinc-400 mb-1">{formatDate(selectedEvent.date)}</p>
                                    <p className="text-center text-sm text-zinc-400 mb-6">
                                        Have attendees scan this QR code with the app to check in for the event.
                                    </p>
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={refreshQRCode}
                                            disabled={isQrRefreshing}
                                            className="px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isQrRefreshing ? 'Refreshing...' : 'Refresh QR Code'}
                                        </button>
                                        <Link
                                            href={`/admin/event-registrations?eventId=${selectedEvent._id}`}
                                            className="px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-colors"
                                        >
                                            View Registrations
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <p className="text-zinc-400">Select an event to generate a check-in QR code.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
} 