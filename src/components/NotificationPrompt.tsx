'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useAuth } from '@/lib/auth-context';
import Button from './Button';
import { cn } from '@/lib/utils';
import { BellIcon, } from '@heroicons/react/24/solid';

interface NotificationPromptProps {
    className?: string;
    showOnlyWhenSupported?: boolean;
}

export default function NotificationPrompt({
    className,
    showOnlyWhenSupported = true
}: NotificationPromptProps) {
    const { isAuthenticated } = useAuth();
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        subscribe
    } = useNotifications();

    const [isDismissed, setIsDismissed] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Check if prompt was previously dismissed
    useEffect(() => {
        const dismissed = localStorage.getItem('notificationPromptDismissed');
        setIsDismissed(dismissed === 'true');
    }, []);


    // Don't show if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Don't show if not supported and showOnlyWhenSupported is true
    if (showOnlyWhenSupported && !isSupported) {
        return null;
    }

    // Don't show if already subscribed or dismissed
    if (isSubscribed || isDismissed) {
        return null;
    }

    // Don't show if permission is denied
    if (permission === 'denied') {
        return null;
    }


    const handleSubscribe = async () => {
        setIsActionLoading(true);
        const success = await subscribe();
        setIsActionLoading(false);

        if (success) {
            setIsDismissed(true);
            localStorage.setItem('notificationPromptDismissed', 'true');
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('notificationPromptDismissed', 'true');
    };

    const handleNotNow = () => {
        setIsDismissed(true);
        // Don't save to localStorage so it shows again next session
    };

    if (!isSupported) {
        return (
            <div className={cn(
                "bg-yellow-900 border border-yellow-700 rounded-lg p-4",
                className
            )}>
                <div className="flex items-start">
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-yellow-300 mb-1">
                            Notifications Not Supported
                        </h3>
                        <p className="text-sm text-yellow-200">
                            Your browser doesn&apos;t support push notifications. Consider updating your browser for the best experience.
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-yellow-400 hover:text-yellow-300 ml-4"
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "bg-black backdrop-blur-2xl border border-zinc-800 p-4 my-2 mx-3 md:mx-0 rounded-lg",
            className
        )}>
            <div className="flex items-start w-full overflow-auto">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-zinc-300 mb-1">
                        Stay Updated with CLOKA
                    </h3>
                    <p className="text-xs text-zinc-200 mb-3">
                        Get notified about important updates from CLOKA.
                    </p>

                    {error && (
                        <div className="bg-red-900 border border-red-700 rounded p-2 mb-3">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSubscribe}
                            isLoading={isActionLoading || isLoading}
                            className="bg-white !text-black text-xs px-3 py-1 rounded transition-colors capitalize"
                        >
                            <div className='flex items-center gap-2 text-left'>{!(isActionLoading || isLoading) && <BellIcon className='h-5 w-5 mr-1' />}
                                Enable Notifications</div>
                        </Button>
                        <Button
                            onClick={handleDismiss}
                            className="text-zinc-400 hover:text-zinc-300 text-xs px-3 py-1 transition-colors"
                        >
                            Don&apos;t Ask Again
                        </Button>
                    </div>
                </div>

                <button
                    onClick={handleNotNow}
                    className="text-zinc-400 hover:text-zinc-300 ml-4"
                    aria-label="Dismiss"
                >
                    ✕
                </button>
            </div>
        </div>
    );
} 