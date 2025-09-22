'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Button from './Button';
import { pwaUtils } from '@/lib/utils';

interface EventRegistrationButtonProps {
    eventId: string;
    isRegistered?: boolean;
    isApproved?: boolean | null;
    isPastEvent?: boolean;
    autoApprove?: boolean;
    additionalInfoField?: {
        label: string;
        required: boolean;
        fieldType: 'text' | 'number' | 'select';
        options?: string[];
    };
    onRegistrationChange?: () => void;
}

export default function EventRegistrationButton({
    eventId,
    isRegistered = false,
    isApproved = null,
    isPastEvent = false,
    autoApprove = false,
    additionalInfoField,
    onRegistrationChange,
}: EventRegistrationButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAdditionalInfoForm, setShowAdditionalInfoForm] = useState(false);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const { isAuthenticated, logout } = useAuth();
    const router = useRouter();

    const handleRegister = async (additionalInfoData?: string) => {
        if (!isAuthenticated) {
            router.push(`/auth?redirect=/events/${eventId}`);
            return;
        }

        // Prevent registration for past events
        if (isPastEvent) {
            setError('This event has already taken place and is no longer open for registration.');
            return;
        }

        // If additional info is required and not provided, show the form
        if (additionalInfoField?.label && !additionalInfoData) {
            setShowAdditionalInfoForm(true);
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
                body: JSON.stringify({
                    eventId,
                    additionalInfo: additionalInfoData || ''
                }),
            });

            const data = await response.json();

            if (response.status === 401) {
                await logout();
                router.push(`/auth?redirect=/events/${eventId}&message=Session%20expired.%20Please%20log%20in%20again.`);
                return;
            }

            if (response.ok) {
                // Close the form and clear cache before refreshing
                setShowAdditionalInfoForm(false);
                setAdditionalInfo('');
                await pwaUtils.clearEventsCache();
                onRegistrationChange?.();
            } else {
                setError(data.message || 'Failed to register for event');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdditionalInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required field
        if (additionalInfoField?.required && !additionalInfo.trim()) {
            setError(`${additionalInfoField.label} is required.`);
            return;
        }

        handleRegister(additionalInfo.trim());
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
                // Clear cache and refresh the page to show updated registration status
                await pwaUtils.clearEventsCache();
                onRegistrationChange?.();
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
            <>
                <div>
                    <button
                        onClick={() => handleRegister()}
                        disabled={isLoading}
                        className={`w-full rounded-md py-3 px-5 cursor-pointer font-bold transition-colors bg-white text-black hover:bg-zinc-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {isLoading ? 'Registering...' : 'Click to Register'}
                    </button>

                    {/* Show auto-approval message if enabled */}
                    {autoApprove && (
                        <div className="mt-3 p-3 bg-green-900/30 border border-green-800 text-green-300 text-sm rounded">
                            ✓ This event has automatic approval enabled. Your registration will be approved immediately.
                        </div>
                    )}

                    {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
                </div>

                {/* Additional Info Modal */}
                {showAdditionalInfoForm && additionalInfoField && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-zinc-900 text-white p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold mb-4">
                                Additional Information Required
                            </h3>

                            <form onSubmit={handleAdditionalInfoSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                        {additionalInfoField.label}
                                        {additionalInfoField.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>

                                    {additionalInfoField.fieldType === 'select' ? (
                                        <select
                                            value={additionalInfo}
                                            onChange={(e) => setAdditionalInfo(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
                                            required={additionalInfoField.required}
                                        >
                                            <option value="">Select an option</option>
                                            {additionalInfoField.options?.map((option, index) => (
                                                <option key={index} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={additionalInfoField.fieldType}
                                            value={additionalInfo}
                                            onChange={(e) => setAdditionalInfo(e.target.value)}
                                            className="w-full p-3  bg-black/40 rounded-md focus:ring-2 focus:ring-black focus:border-black"
                                            required={additionalInfoField.required}
                                            placeholder={`Enter ${additionalInfoField.label.toLowerCase()}`}
                                        />
                                    )}
                                </div>

                                {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAdditionalInfoForm(false);
                                            setAdditionalInfo('');
                                            setError('');
                                        }}
                                        className="flex-1 px-4 py-2  text-zinc-300 border border-zinc-400  cursor-pointer transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`flex-1 !font-bold cursor-pointer px-4 border border-white py-2 bg-black text-white hover:bg-white hover:text-black transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isLoading ? 'Registering...' : 'Register'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // User is registered
    return (
        <div>
            <div className="mb-4">
                {isApproved === true ? (
                    <div className="p-3 bg-green-900/30 border  rounded-lg border-green-800 text-green-300 ">
                        Your registration has been approved!
                    </div>
                ) : isApproved === false ? (
                    <div className="p-3 bg-red-900/30 border  rounded-lg border-red-800 text-red-300 ">
                        Your registration has been declined.
                    </div>
                ) : (
                    <div className="p-3 bg-yellow-900/30 border rounded-lg border-yellow-800 text-yellow-300 ">
                        Your registration is pending approval.
                    </div>
                )}
            </div>

            <Button
                onClick={handleCancel}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg transition-colors bg-red-900 hover:bg-red-800 text-white ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
            >
                {isLoading ? 'Cancelling...' : 'Cancel Registration'}
            </Button>
            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        </div>
    );
} 