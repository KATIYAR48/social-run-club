'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import EventCard from './EventCard';

type ApiEventProps = {
    _id: string;
    title: string;
    date: string; // ISO date string from server
    location: string;
    description: string;
    bannerImageURL?: string | null;
};

interface EventsToggleProps {
    allEvents: ApiEventProps[];
    upcomingEvents: ApiEventProps[];
}

const EventsToggle = ({ allEvents, upcomingEvents }: EventsToggleProps) => {
    const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
    const [events, setEvents] = useState<ApiEventProps[]>(upcomingEvents);

    // Sync events state with props changes
    useEffect(() => {
        setEvents(showUpcomingOnly ? upcomingEvents : allEvents);
    }, [allEvents, upcomingEvents, showUpcomingOnly]);

    // Toggle between all events and upcoming events
    const toggleEvents = (showUpcoming: boolean) => {
        setShowUpcomingOnly(showUpcoming);
        setEvents(showUpcoming ? upcomingEvents : allEvents);
    };

    return (
        <>
            <div className="flex md:justify-end justify-center mb-8">
                <div className="inline-flex items-center bg-zinc-900 rounded-lg p-1">
                    <Button
                        onClick={() => toggleEvents(false)}
                        variant={!showUpcomingOnly ? 'secondary' : 'primary'}
                        size="small"
                        className={`px-3 py-1 font-medium transition-colors ${!showUpcomingOnly
                            ? 'bg-transparent text-zinc-400 hover:text-white'
                            : ''
                            }`}
                    >
                        All Events
                    </Button>
                    <Button
                        onClick={() => toggleEvents(true)}
                        variant={showUpcomingOnly ? 'secondary' : 'primary'}
                        size="small"
                        className={`px-4 py-1 font-medium transition-colors ${showUpcomingOnly
                            ? ''
                            : 'bg-transparent text-zinc-400 hover:text-white'
                            }`}
                    >
                        Upcoming Only
                    </Button>
                </div>
            </div>

            {events.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {events.map((event) => (
                        <EventCard
                            key={event._id}
                            event={{
                                id: event._id,
                                title: event.title,
                                date: event.date,
                                location: event.location,
                                description: event.description,
                                bannerImageURL: event.bannerImageURL,
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                    <h2 className="text-xl font-bold mb-4">No events found</h2>
                    <p className="text-zinc-400">
                        {showUpcomingOnly
                            ? 'There are no upcoming events at this time. Check back soon for new events or contact us for more information.'
                            : 'No events found. Please check back later or contact us for more information.'}
                    </p>
                </div>
            )}
        </>
    );
};

export default EventsToggle; 