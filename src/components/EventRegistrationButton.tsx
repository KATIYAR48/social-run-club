'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Button from './Button';

interface EventRegistrationButtonProps {
    eventId: string;
    isRegistered?: boolean;
    isApproved?: boolean | null;
    isPastEvent?: boolean;
}

export default function EventRegistrationButton({
    eventId,
    isRegistered = false,
    isApproved = null,
    isPastEvent = false,
}: EventRegistrationButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!isAuthenticated) {
            router.push(`/auth?redirect=/events/${eventId}`);
            return;
        }

        // Prevent registration for past events
        if (isPastEvent) {
            setError('This event has already taken place and is no longer open for registration.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/events/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventId }),
            });

            const data = await response.json();

            if (response.status === 401) {
                await logout();
                router.push(`/auth?redirect=/events/${eventId}&message=Session%20expired.%20Please%20log%20in%20again.`);
                return;
            }

            if (response.ok) {
                // Refresh the page to show updated registration status
                router.refresh();
            } else {
                setError(data.message || 'Failed to register for event');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!isAuthenticated) {
            router.push(`/auth?redirect=/events/${eventId}`);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/events/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventId }),
            });

            const data = await response.json();

            if (response.status === 401) {
                await logout();
                router.push(`/auth?redirect=/events/${eventId}&message=Session%20expired.%20Please%20log%20in%20again.`);
                return;
            }

            if (response.ok) {
                // Refresh the page to show updated registration status
                router.refresh();
            } else {
                setError(data.message || 'Failed to cancel registration');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Render different button based on registration status
    if (!isRegistered) {
        return (
            <div>
                <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className={`w-full py-3 px-6 cursor-pointer transition-colors bg-white text-black hover:bg-zinc-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                >
                    {isLoading ? 'Registering...' : 'Register for Event'}
                </button>
                {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
            </div>
        );
    }

    // User is registered
    return (
        <div>
            <div className="mb-4">
                {isApproved === true ? (
                    <div className="p-3 bg-green-900/30 border border-green-800 text-green-300 ">
                        Your registration has been approved!
                    </div>
                ) : isApproved === false ? (
                    <div className="p-3 bg-red-900/30 border border-red-800 text-red-300 ">
                        Your registration has been declined.
                    </div>
                ) : (
                    <div className="p-3 bg-yellow-900/30 border border-yellow-800 text-yellow-300 ">
                        Your registration is pending approval.
                    </div>
                )}
            </div>

            <Button
                onClick={handleCancel}
                disabled={isLoading}
                className={`w-full py-3 px-6 transition-colors bg-red-900 hover:bg-red-800 text-white ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
            >
                {isLoading ? 'Cancelling...' : 'Cancel Registration'}
            </Button>
            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        </div>
    );
} 