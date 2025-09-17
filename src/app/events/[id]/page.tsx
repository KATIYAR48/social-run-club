import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import EventDetailClientPage from './client-page';

// Define the params type for this page
type PageParams = {
    id: string;
};

// Define the metadata generation function
export async function generateMetadata({
    params
}: {
    params: PageParams
}): Promise<Metadata> {
    // Connect to the database
    await dbConnect();

    // Await the entire params object
    const resolvedParams = await params;

    // Fetch the event
    const event = await Event.findById(resolvedParams.id);

    if (!event) {
        return {
            title: 'Event Not Found - CLOKA',
            description: 'The requested event could not be found.',
        };
    }

    return {
        title: `${event.title} - CLOKA Events`,
        description: event.description,
        openGraph: {
            title: `${event.title} - CLOKA Events`,
            description: event.description,
            type: 'article',
            publishedTime: event.createdAt.toISOString(),
            authors: ['CLOKA'],
        },
    };
}

// Define the page component
export default async function EventDetailPage({
    params
}: {
    params: { id: string }
}) {
    // Connect to the database
    await dbConnect();

    // Await the entire params object
    const resolvedParams = await params;

    // Fetch the event to check if it exists
    const event = await Event.findById(resolvedParams.id);

    if (!event) {
        notFound();
    }

    // Use client component for dynamic data fetching and real-time updates
    return <EventDetailClientPage eventId={resolvedParams.id} />;
} 