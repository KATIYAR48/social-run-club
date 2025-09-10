'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Button from '@/components/Button';

interface Event {
    _id: string;
    title: string;
    date: string;
    location: string;
}

export default function CheckInPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId');
    const token = searchParams.get('token');

    const [event, setEvent] = useState<Event | null>(null);
    const [isEventLoading, setIsEventLoading] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [tokenValidationLoading, setTokenValidationLoading] = useState(false);
    const [checkInStatus, setCheckInStatus] = useState<{
        success: boolean;
        message: string;
        isLoading: boolean;
    }>({
        success: false,
        message: '',
        isLoading: false,
    });

    const validateToken = useCallback(async () => {
        try {
            setTokenValidationLoading(true);
            const response = await fetch('/api/events/validate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventId, token }),
            });

            const data = await response.json();
            console.log('Token validation response:', data);

            if (data.success) {
                setIsTokenValid(true);
            } else {
                setCheckInStatus({
                    success: false,
                    message: data.message || 'Invalid check-in token. Please scan the QR code at the event venue.',
                    isLoading: false,
                });
                setIsEventLoading(false);
            }
        } catch (error) {
            console.error('Error validating token:', error);
            setCheckInStatus({
                success: false,
                message: 'An error occurred while validating the check-in token.',
                isLoading: false,
            });
            setIsEventLoading(false);
        } finally {
            setTokenValidationLoading(false);
        }
    }, [eventId, token]);

    const fetchEventDetails = useCallback(async () => {
        try {
            setIsEventLoading(true);
            const response = await fetch(`/api/events?id=${eventId}`);
            console.log('Fetching event details for ID:', eventId);
            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Response data:', data);
                if (data.event) {
                    setEvent(data.event);
                } else {
                    setCheckInStatus({
                        success: false,
                        message: 'Event not found in response data',
                        isLoading: false,
                    });
                }
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                setCheckInStatus({
                    success: false,
                    message: `Failed to fetch event details: ${errorData.message || response.statusText}`,
                    isLoading: false,
                });
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
            setCheckInStatus({
                success: false,
                message: `An error occurred while fetching event details: ${error instanceof Error ? error.message : 'Unknown error'}`,
                isLoading: false,
            });
        } finally {
            setIsEventLoading(false);
        }
    }, [eventId]);

    // Check if opened in PWA context
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        // Check if running as PWA
        const checkPWA = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
            setIsPWA(isStandalone || isIOSStandalone);
        };

        checkPWA();
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(`/auth?redirect=/check-in?eventId=${eventId}&token=${token}`);
        }
    }, [isLoading, isAuthenticated, router, eventId, token]);

    // Validate token
    useEffect(() => {
        if (isAuthenticated && eventId && token) {
            validateToken();
        } else if (isAuthenticated && !token) {
            setCheckInStatus({
                success: false,
                message: 'No check-in token provided. Please scan the QR code at the event venue.',
                isLoading: false,
            });
            setIsEventLoading(false);
        }
    }, [isAuthenticated, eventId, token, validateToken]);

    // Fetch event details
    useEffect(() => {
        if (isAuthenticated && eventId && isTokenValid) {
            fetchEventDetails();
        }
    }, [isAuthenticated, eventId, isTokenValid, fetchEventDetails]);

    const handleCheckIn = async () => {
        if (!eventId || !isTokenValid || !token) return;

        try {
            setCheckInStatus({
                ...checkInStatus,
                isLoading: true,
            });

            const response = await fetch('/api/events/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventId, token }),
            });

            const data = await response.json();

            setCheckInStatus({
                success: data.success,
                message: data.message,
                isLoading: false,
            });
        } catch (error) {
            console.error('Error checking in:', error);
            setCheckInStatus({
                success: false,
                message: 'An error occurred during check-in',
                isLoading: false,
            });
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

    if (isLoading || (isAuthenticated && !user) || tokenValidationLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full bg-black border border-zinc-800 rounded-none shadow-md p-6"
            >
                <h1 className="text-2xl font-bold text-center text-white mb-6">Event Check-In</h1>

                {!isPWA && (
                    <div className="mb-6 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="text-blue-300 font-semibold mb-1">For Better Experience</h3>
                                <p className="text-blue-200 text-sm">
                                    Install the CLOKA app for a native experience. You can also use the in-app QR scanner instead of your camera app.
                                </p>
                                <Link href="/qr-scanner" className="text-blue-300 hover:text-blue-200 text-sm underline mt-1 inline-block">
                                    Open In-App QR Scanner →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {!eventId ? (
                    <div className="text-center">
                        <p className="text-red-500 mb-4">No event ID provided</p>
                        <Link href="/my-events" className="text-white hover:text-zinc-300 hover:underline">
                            View My Events
                        </Link>
                    </div>
                ) : !token ? (
                    <div className="text-center">
                        <p className="text-red-500 mb-4">No check-in token provided. Please scan the QR code at the event venue.</p>
                        <Link href="/my-events" className="text-white hover:text-zinc-300 hover:underline">
                            View My Events
                        </Link>
                    </div>
                ) : checkInStatus.message ? (
                    <div className="text-center">
                        <div className={`mb-4 p-4 border ${checkInStatus.success ? 'border-green-800 bg-zinc-900 text-green-400' : 'border-red-800 bg-zinc-900 text-red-400'}`}>
                            <p>{checkInStatus.message}</p>
                        </div>
                        {checkInStatus.success ? (
                            <div className="mt-6">
                                <div className="mb-4 flex items-center justify-center">
                                    <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                {event && (
                                    <>
                                        <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                                        <p className="text-zinc-400 mb-1">{formatDate(event.date)}</p>
                                        <p className="text-zinc-400 mb-4">{event.location}</p>
                                    </>
                                )}
                                <p className="text-green-400 font-medium">You&apos;re all set! Enjoy the event.</p>
                            </div>
                        ) : (
                            <Link href="/my-events" className="text-white hover:text-zinc-300 hover:underline">
                                View My Events
                            </Link>
                        )}
                    </div>
                ) : isEventLoading ? (
                    <div className="flex justify-center my-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                    </div>
                ) : !event ? (
                    <div className="text-center">
                        <p className="text-red-500 mb-4">Event not found</p>
                        <Link href="/my-events" className="text-white hover:text-zinc-300 hover:underline">
                            View My Events
                        </Link>
                    </div>
                ) : (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                            <p className="text-zinc-400 mb-1">{formatDate(event.date)}</p>
                            <p className="text-zinc-400">{event.location}</p>
                        </div>

                        <div className="border-t border-zinc-800 pt-6">
                            <p className="text-center text-zinc-300 mb-6">
                                Ready to check in for this event?
                            </p>

                            <Button
                                onClick={handleCheckIn}
                                variant="secondary"
                                disabled={checkInStatus.isLoading}
                                className="w-full py-3  disabled:text-zinc-400 disabled:cursor-not-allowed"
                            >
                                {checkInStatus.isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking in...
                                    </span>
                                ) : (
                                    'Check In Now'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
} 