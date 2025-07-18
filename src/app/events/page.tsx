import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import EventsToggle from '@/components/EventsToggle';

export const metadata: Metadata = {
    title: 'Events - CLOKA',
    description: 'Browse and register for upcoming CLOKA events.',
};

export default async function EventsPage() {
    // Connect to the database
    await dbConnect();

    // Fetch all events
    const allEvents = await Event.find({}).sort({ date: -1 });

    // Separate upcoming events
    const upcomingEvents = allEvents.filter(event => new Date(event.date) >= new Date());

    // Pass raw dates to client component for proper timezone handling
    const formattedAllEvents = allEvents.map(event => ({
        ...event.toObject(),
        date: event.date.toISOString() // Keep raw date as ISO string
    }));

    const formattedUpcomingEvents = upcomingEvents.map(event => ({
        ...event.toObject(),
        date: event.date.toISOString() // Keep raw date as ISO string
    }));

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white py-12 px-4">
                <div className="luxury-container">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                        <h1 className="text-3xl font-bold">Events</h1>
                        <p className="text-zinc-400 mt-2 md:mt-0">
                            Join us for exciting events and connect with the community
                        </p>
                    </div>

                    <EventsToggle
                        allEvents={JSON.parse(JSON.stringify(formattedAllEvents))}
                        upcomingEvents={JSON.parse(JSON.stringify(formattedUpcomingEvents))}
                    />
                </div>
            </main>
            <Footer />
        </>
    );
} 