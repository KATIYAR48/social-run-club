'use client';

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

interface ApiResponse {
    success: boolean;
    events: ApiEventProps[];
}

export default function EventsClientPage() {
    const {
        data: allEventsData,
        loading: allEventsLoading,
        error: allEventsError,
        lastUpdated: allEventsLastUpdated,
        refresh: refreshAllEvents
    } = useDataFetching<ApiResponse>({
        url: '/api/events?all=true',
        refreshInterval: 60000, // Refresh every minute
        forceRefresh: true // Force fresh data on load
    });

    const {
        data: upcomingEventsData,
        loading: upcomingEventsLoading,
        error: upcomingEventsError,
        lastUpdated: upcomingEventsLastUpdated,
        refresh: refreshUpcomingEvents
    } = useDataFetching<ApiResponse>({
        url: '/api/events',
        refreshInterval: 60000, // Refresh every minute
        forceRefresh: true // Force fresh data on load
    });

    // Combine the data
    const eventsData: EventsData | null = allEventsData && upcomingEventsData ? {
        allEvents: allEventsData.events || [],
        upcomingEvents: upcomingEventsData.events || []
    } : null;

    const loading = allEventsLoading || upcomingEventsLoading;
    const error = allEventsError || upcomingEventsError;
    const lastUpdated = allEventsLastUpdated && upcomingEventsLastUpdated ?
        new Date(Math.max(allEventsLastUpdated.getTime(), upcomingEventsLastUpdated.getTime())) :
        allEventsLastUpdated || upcomingEventsLastUpdated;

    const handleRefresh = async () => {
        // Clear events cache first to ensure fresh data
        await pwaUtils.clearEventsCache();
        // Then refresh both endpoints
        refreshAllEvents();
        refreshUpcomingEvents();
    };

    if (loading && !eventsData) {
        return (
            <div>
                <div className="animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-zinc-900 rounded-lg h-64"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                    <h2 className="text-xl font-bold mb-4">Failed to load events</h2>

                    <button
                        onClick={handleRefresh}
                        className="bg-zinc-600 text-white px-4 py-2 rounded hover:bg-zinc-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { allEvents = [], upcomingEvents = [] } = eventsData || {};

    return (
        <div className="">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5">
                {/* Data refresh indicator */}
                <div className="flex justify-center md:justify-start w-full">
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
    );
}
