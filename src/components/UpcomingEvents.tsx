'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/apiUtils';
import Button from './Button';
import EventCard, { EventCardProps } from './EventCard';
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

// Props for the UpcomingEvents component
interface UpcomingEventsProps {
    serverEvents?: EventCardProps[];
}

const UpcomingEvents = ({ serverEvents }: UpcomingEventsProps) => {
    const [events, setEvents] = useState<EventCardProps[]>(serverEvents || []);
    const [loading, setLoading] = useState(!serverEvents);
    const [error, setError] = useState('');

    useEffect(() => {
        if (serverEvents) {
            return; // Skip fetching if server events are provided
        }

        const fetchEvents = async () => {
            setLoading(true);
            try {
                // Explicitly request only upcoming events (default behavior of the API)
                const data = await fetchApi<{ events: ApiEventData[] }>('/api/events');

                // Transform API data to component format
                const formattedEvents = data.events.map((event: ApiEventData) => {
                    return {
                        id: event._id,
                        title: event.title,
                        date: event.date, // Pass raw ISO date string for client-side formatting
                        location: event.location,
                        description: event.description,
                        bannerImageURL: event.bannerImageURL,
                    };
                });

                setEvents(formattedEvents);
            } catch (error) {
                console.error('Error fetching events:', error);
                setError('Failed to load events. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [serverEvents]);

    return (
        <section className="py-16 bg-black text-white">
            <div className="luxury-container border-t border-zinc-600">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-12 mb-10">
                    <h2 className="text-4xl font-bold">Upcoming Events</h2>
                    <p className="text-zinc-400 text-xl mt-2 md:mt-0">
                        What are you waiting for?
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <Loader text="Loading events..." />
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-400">{error}</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12">
                        <p>No upcoming events at this time. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                )}

                <div className="text-center mt-12">
                    <Button
                        href="/events"
                        className="inline-block !text-zinc-300 !bg-zinc-800 text-lg"
                    >
                        View more
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default UpcomingEvents; 