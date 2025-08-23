'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

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

    // Fetch events
    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setIsEventsLoading(true);
            const response = await fetch('/api/events');

            if (response.ok) {
                const data = await response.json();
                // Filter out past events
                const now = new Date();
                const upcomingEvents = data.events.filter((event: Event) => new Date(event.date) >= now);
                setEvents(upcomingEvents || []);
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

    const generateQRValue = (eventId: string) => {
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
    };

    if (isEventsLoading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-black text-white py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold mb-8"
                    >
                        Event Check-In Management
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
                                <p className="text-zinc-400">No upcoming events found.</p>
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
                            <h2 className="text-xl font-bold mb-4">Check-In QR Code</h2>
                            {selectedEvent ? (
                                <div className="flex flex-col items-center">
                                    <div className="bg-white p-4 rounded-lg mb-4">
                                        <QRCode
                                            value={generateQRValue(selectedEvent._id)}
                                            size={256}
                                        />
                                    </div>
                                    <p className="text-center mb-2 font-medium">{selectedEvent.title}</p>
                                    <p className="text-center text-sm text-zinc-400 mb-4">{formatDate(selectedEvent.date)}</p>
                                    <p className="text-center text-sm text-zinc-400 mb-6">
                                        Have attendees scan this QR code with the app to check in for the event.
                                    </p>
                                    <div className="flex space-x-4">
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