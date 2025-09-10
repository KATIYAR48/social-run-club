'use client';

interface StravaQuotaExceededProps {
    onRetry?: () => void;
}

export default function StravaQuotaExceeded({ onRetry }: StravaQuotaExceededProps) {
    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                        Strava Integration Temporarily Unavailable
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                        <p>
                            We've reached our current limit for Strava connections. Our team is working to increase our quota with Strava.
                        </p>
                        <p className="mt-2">
                            In the meantime, you can still use all other features of the app. We'll notify you once Strava integration is available again.
                        </p>
                    </div>
                    <div className="mt-4">
                        <div className="-mx-2 -my-1.5 flex">
                            {onRetry && (
                                <button
                                    onClick={onRetry}
                                    className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                                >
                                    Try Again
                                </button>
                            )}
                            <a
                                href="mailto:support@cloka.com?subject=Strava%20Integration%20Support"
                                className="ml-3 bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                            >
                                Contact Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
