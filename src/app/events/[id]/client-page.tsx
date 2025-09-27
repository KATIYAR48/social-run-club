'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventRegistrationButton from '@/components/EventRegistrationButton';
import TemporaryPaymentButton from '@/components/TemporaryPaymentButton';
import EventLocalDate from '@/components/EventLocalDate';
import { useDataFetching } from '@/lib/hooks/useDataFetching';
import { pwaUtils } from '@/lib/utils';
import Loader from "@/components/ui/PixelLoader"

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    exactLocation?: string;
    postApprovalMessage?: string;
    postRejectionMessage?: string;
    razorpayButtonId?: string;
    bannerImageURL?: string;
    autoApprove?: boolean;
    additionalInfoField?: {
        label: string;
        required: boolean;
        fieldType: 'text' | 'number' | 'select';
        options?: string[];
    };
}

interface EventData {
    success: boolean;
    event: Event;
}

interface UserEventData {
    success: boolean;
    events: Array<{
        _id: string;
        approved: boolean | null;
        checkedIn: boolean;
    }>;
}

export default function EventDetailClientPage({ eventId }: { eventId: string }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEventData, setUserEventData] = useState<UserEventData | null>(null);

    // Fetch event data with automatic refresh
    const {
        data: eventData,
        loading: eventLoading,
        error: eventError,
        lastUpdated,
        refresh: refreshEvent
    } = useDataFetching<EventData>({
        url: `/api/events?id=${eventId}`,
        refreshInterval: 30000, // Refresh every 30 seconds
        forceRefresh: true
    });

    // Fetch user event data to check approval status
    const {
        data: userEventsData,
        refresh: refreshUserEvents
    } = useDataFetching<UserEventData>({
        url: '/api/user/events',
        refreshInterval: 30000, // Refresh every 30 seconds
        forceRefresh: true
    });

    // Check if user is logged in
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/user/profile');
                setIsLoggedIn(response.ok);
            } catch {
                setIsLoggedIn(false);
            }
        };
        checkAuth();
    }, []);

    // Update user event data when it changes
    useEffect(() => {
        if (userEventsData) {
            setUserEventData(userEventsData);
        }
    }, [userEventsData]);

    // Get approval status for this event
    const getUserEventStatus = () => {
        if (!userEventData?.events) return { isRegistered: false, isApproved: null };

        const userEvent = userEventData.events.find(ue => ue._id === eventId);
        return {
            isRegistered: !!userEvent,
            isApproved: userEvent?.approved || null
        };
    };

    const { isRegistered, isApproved } = getUserEventStatus();

    // Handle manual refresh
    const handleRefresh = async () => {
        await pwaUtils.clearEventsCache();
        refreshEvent();
        refreshUserEvents();
    };

    if (eventLoading) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-black text-white py-12 px-4">
                    <div className="md:container md:mx-auto">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <Loader text='Loading event details...' />
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (eventError || !eventData?.event) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-black text-white py-12 px-4">
                    <div className="md:container md:mx-auto">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
                            <p className="text-zinc-400 mb-6">The requested event could not be found.</p>
                            <Link href="/events" className="luxury-button">
                                Back to Events
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const event = eventData.event;

    // Check if event is in the past
    const isPastEvent = new Date(event.date).getTime() + 2 * 60 * 60 * 1000 < Date.now();

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white py-12 px-4">
                <div className="md:container md:mx-auto">
                    <Link href="/events" className="inline-flex items-center text-zinc-400 hover:text-white mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Events
                    </Link>

                    {/* Data freshness indicator */}
                    {lastUpdated && (
                        <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">
                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                </span>
                                <button
                                    onClick={handleRefresh}
                                    className="text-sm text-white hover:text-zinc-300 underline"
                                >
                                    Refresh Data
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-black text-white border border-zinc-700 rounded-xl">
                        {/* Event Header */}
                        <div className={`relative w-full ${event.bannerImageURL ? 'h-[32rem]' : 'h-96'}`}>
                            {event.bannerImageURL ? (
                                <img
                                    src={event.bannerImageURL}
                                    alt={event.title}
                                    className="absolute inset-0 w-full h-full object-cover object-[center_33%]"
                                />
                            ) : (
                                <video
                                    src="/teaser.MP4"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="absolute rounded-t-xl inset-0 w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                            <div className="absolute bottom-0 left-2 p-6">
                                <h1 className="text-3xl md:text-4xl font-bold text-white">{event.title}</h1>
                                <p className="text-zinc-300 mt-2">
                                    <EventLocalDate date={event.date} />
                                </p>
                            </div>
                        </div>

                        {/* Event Content */}
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="md:w-2/3">
                                    <h2 className="text-lg font-bold mb-4">About This Event</h2>
                                    <p className="text-zinc-400 text-sm whitespace-pre-line">{event.description}</p>

                                    <div className="mt-8">
                                        <h2 className="text-lg font-bold mb-4">Where?</h2>
                                        {isApproved === true ? (
                                            <>
                                                <p className="text-zinc-300">{event.location}</p>
                                                {isLoggedIn && event.exactLocation && (
                                                    <div className="mt-4 p-4  bg-gradient-to-tl border border-zinc-800 from-black to-zinc-700 rounded-lg">
                                                        <p className="text-zinc-300 mb-2">Exact Location:</p>
                                                        <p className="text-zinc-300">{event.exactLocation}</p>
                                                        {event.exactLocation.includes("maps.google.com") ||
                                                            event.exactLocation.includes("goo.gl/maps") ||
                                                            event.exactLocation.includes("maps.app.goo.gl") ? (
                                                            <a
                                                                href={event.exactLocation}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-2 inline-block luxury-button"
                                                            >
                                                                Open in Google Maps
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                )}

                                                {/* Display post-approval message if available */}
                                                {event.postApprovalMessage && (
                                                    <div className="mt-4 p-4  bg-gradient-to-tl border border-zinc-800 from-black to-zinc-700 rounded-lg">
                                                        <h3 className="text-lg font-semibold mb-2">Important Information</h3>
                                                        <p className="text-zinc-300 whitespace-pre-line">{event.postApprovalMessage}</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="p-4  bg-gradient-to-tl border border-zinc-800 from-black to-zinc-700 rounded-lg">
                                                <p className="text-zinc-300 whitespace-pre-line">
                                                    {isRegistered ? (
                                                        isApproved === false ? (
                                                            event.postRejectionMessage ||
                                                            "Hey Runner,\n\nWe're so grateful for your energy and excitement! \nThis time, we couldn't fit everyone in, but don't sweat it—we're lacing up for the next run soon, and we can't wait to see you there.\n\nKeep that spirit high, and we'll be running together before you know it!\n\nMuch love,\nThe Cloka Team"
                                                        ) : (
                                                            "Your registration is pending approval. Location details will be available once approved."
                                                        )
                                                    ) : (
                                                        "Register for this event to view location details."
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                        {!isLoggedIn && event.exactLocation && (
                                            <div className="mt-4 p-4  bg-gradient-to-tl border border-zinc-800 from-black to-zinc-700 rounded-lg">
                                                <p className="text-zinc-300">
                                                    <Link href={`/auth?redirect=/events/${eventId}`} className="text-accent hover:underline">
                                                        Log in
                                                    </Link> to see the exact location details.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="md:w-1/3">
                                    <div className=" bg-gradient-to-tl border border-zinc-800 from-black to-zinc-700 rounded-lg p-6">
                                        <h2 className="text-lg font-bold mb-4">Registration</h2>
                                        {isPastEvent ? (
                                            <div className="p-3 bg-zinc-800 text-zinc-300 rounded-md">
                                                This event has already taken place.
                                            </div>
                                        ) : (
                                            <>
                                                <EventRegistrationButton
                                                    eventId={eventId}
                                                    isRegistered={isRegistered}
                                                    isApproved={isApproved}
                                                    isPastEvent={isPastEvent}
                                                    autoApprove={event.autoApprove}
                                                    additionalInfoField={event.additionalInfoField ? {
                                                        label: event.additionalInfoField.label,
                                                        required: event.additionalInfoField.required,
                                                        fieldType: event.additionalInfoField.fieldType,
                                                        options: event.additionalInfoField.options
                                                    } : undefined}
                                                    onRegistrationChange={() => {
                                                        refreshEvent();
                                                        refreshUserEvents();
                                                    }}
                                                />

                                                {/* Show payment button if approved and razorpayButtonId exists */}
                                                {isApproved && event.razorpayButtonId && (
                                                    <div className="mt-4 p-4 bg-zinc-800 rounded-md">
                                                        <h3 className="text-lg font-semibold mb-2">Payment</h3>
                                                        <p className="text-zinc-300 mb-4">Complete your payment to confirm your spot. Ignore this if you have already paid.</p>


                                                        <TemporaryPaymentButton paymentButtonId={event.razorpayButtonId} />

                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
