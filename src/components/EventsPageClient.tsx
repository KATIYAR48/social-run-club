'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/apiUtils';
import EventsToggle from './EventsToggle';
import Loader from "@/components/ui/PixelLoader"

// Type for the event data from the API
type ApiEventData = {
    _id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    createdAt: string;
    bannerImageURL?: string | null;
};

const EventsPageClient = () => {
    const [allEvents, setAllEvents] = useState<ApiEventData[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<ApiEventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                // Fetch all events and upcoming events separately
                const [allEventsData, upcomingEventsData] = await Promise.all([
                    fetchApi<{ events: ApiEventData[] }>('/api/events?all=true'),
                    fetchApi<{ events: ApiEventData[] }>('/api/events')
                ]);

                setAllEvents(allEventsData.events);
                setUpcomingEvents(upcomingEventsData.events);
            } catch (error) {
                console.error('Error fetching events:', error);
                setError('Failed to load events. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-12">
                <Loader text='Loading events...' />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <EventsToggle
            allEvents={allEvents}
            upcomingEvents={upcomingEvents}
        />
    );
};

export default EventsPageClient;
