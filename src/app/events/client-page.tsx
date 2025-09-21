'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventsToggle from '@/components/EventsToggle';
import { useDataFetching } from '@/lib/hooks/useDataFetching';
import DataRefreshIndicator from '@/components/DataRefreshIndicator';
import { pwaUtils } from '@/lib/utils';

type ApiEventProps = {
    _id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    bannerImageURL: string | null;
};

interface EventsData {
    allEvents: ApiEventProps[];
    upcomingEvents: ApiEventProps[];
}

export default function EventsClientPage() {
    const {
        data: eventsData,
        loading,
        error,
        lastUpdated,
        refresh
    } = useDataFetching<EventsData>({
        url: '/api/events',
        refreshInterval: 60000, // Refresh every minute
        forceRefresh: true // Force fresh data on load
    });

    const handleRefresh = () => {
        refresh();
        // Also clear PWA cache for events
        pwaUtils.clearCache('cloka-dynamic-v2');
    };

    if (loading && !eventsData) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-black text-white py-12 px-4">
                    <div className="luxury-container">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                            <h1 className="text-3xl font-bold">Events</h1>
                            <p className="text-zinc-400 mt-2 md:mt-0">
                                Loading events...
                            </p>
                        </div>
                        <div className="animate-pulse">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-zinc-900 rounded-lg h-64"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-black text-white py-12 px-4">
                    <div className="luxury-container">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                            <h1 className="text-3xl font-bold">Events</h1>
                            <p className="text-zinc-400 mt-2 md:mt-0">
                                Error loading events
                            </p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                            <h2 className="text-xl font-bold mb-4">Failed to load events</h2>
                            <p className="text-zinc-400 mb-4">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const { allEvents = [], upcomingEvents = [] } = eventsData || {};

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white py-12 px-4">
                <div className="luxury-container">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                        <div>
                            <h1 className="text-lg font-bold">Events</h1>
                            <p className="text-zinc-400 text-md mt-2">
                                Join us for exciting events and connect with the community
                            </p>
                        </div>

                        {/* Data refresh indicator */}
                        <div className="mt-4 md:mt-0">
                            <DataRefreshIndicator
                                lastUpdated={lastUpdated}
                                onRefresh={handleRefresh}
                                loading={loading}
                            />
                        </div>
                    </div>

                    <EventsToggle
                        allEvents={allEvents}
                        upcomingEvents={upcomingEvents}
                    />
                </div>
            </main>
            <Footer />
        </>
    );
}
