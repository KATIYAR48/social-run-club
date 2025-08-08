'use client';

import React, { useState, useEffect } from 'react';
import { pwaUtils } from '@/lib/utils';
import { RefreshCw, Trash2, Info, Wifi, WifiOff } from 'lucide-react';

interface CacheInfo {
    name: string;
    size: number;
    urls: string[];
}

export default function PWADebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        // Check if running as PWA
        setIsPWA(pwaUtils.isPWAInstalled());

        // Set up network status listener
        const cleanup = pwaUtils.onNetworkChange((online) => {
            setIsOnline(online);
        });

        return cleanup;
    }, []);

    const loadCacheInfo = async () => {
        const info = await pwaUtils.getCacheInfo();
        setCacheInfo(info);
    };

    const clearAllCaches = async () => {
        await pwaUtils.clearAllCaches();
        await loadCacheInfo();
    };

    const forceRefresh = () => {
        pwaUtils.forceRefresh();
    };

    useEffect(() => {
        if (isOpen) {
            loadCacheInfo();
        }
    }, [isOpen]);

    // Only show in development or when accessed via URL parameter
    const shouldShow = process.env.NODE_ENV === 'development' ||
        typeof window !== 'undefined' && window.location.search.includes('debug=pwa');

    if (!shouldShow) return null;

    return (
        <>
            {/* Debug button - only visible in development */}
            {process.env.NODE_ENV === 'development' && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
                    title="PWA Debug Panel"
                >
                    <Info size={20} />
                </button>
            )}

            {/* Debug panel */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">PWA Debug Panel</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Status indicators */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-sm">
                                        {isOnline ? 'Online' : 'Offline'}
                                    </span>
                                    {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${isPWA ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    <span className="text-sm">
                                        {isPWA ? 'Running as PWA' : 'Running in browser'}
                                    </span>
                                </div>
                            </div>

                            {/* Cache information */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium">Cache Information</h4>
                                    <button
                                        onClick={loadCacheInfo}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Refresh
                                    </button>
                                </div>

                                {cacheInfo.length > 0 ? (
                                    <div className="space-y-2">
                                        {cacheInfo.map((cache) => (
                                            <div key={cache.name} className="text-sm border rounded p-2">
                                                <div className="font-medium">{cache.name}</div>
                                                <div className="text-gray-600">Size: {cache.size} items</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No cache information available</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={clearAllCaches}
                                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Clear All Caches
                                </button>

                                <button
                                    onClick={forceRefresh}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                                >
                                    <RefreshCw size={16} />
                                    Force Refresh App
                                </button>

                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                                >
                                    Reload Page
                                </button>
                            </div>

                            {/* Instructions */}
                            <div className="mt-6 p-3 bg-gray-50 rounded text-sm">
                                <p className="font-medium mb-2">iOS PWA Troubleshooting:</p>
                                <ul className="space-y-1 text-gray-600">
                                    <li>• Pull down to refresh for fresh data</li>
                                    <li>• Use &quot;Clear All Caches&quot; if data seems stale</li>
                                    <li>• &quot;Force Refresh App&quot; updates the service worker</li>
                                    <li>• Close and reopen the app if issues persist</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
