import { motion } from 'framer-motion';
import Button from './Button';

export type EventCardProps = {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    bannerImageURL?: string | null;
};

// Format date similar to admin events page
function formatDate(dateString: string) {
    // If the string is already formatted (contains text like month names), return as is
    // Check if it contains month names or other formatted text
    if (/January|February|March|April|May|June|July|August|September|October|November|December|AM|PM/i.test(dateString)) {
        return dateString;
    }

    // Try to parse, if invalid, return original string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // Not a valid date, likely already formatted
        return dateString;
    }
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

const EventCard = ({ event }: { event: EventCardProps }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-zinc-900 text-white p-6"
        >
            <div className="mb-4">
                <span className="text-sm text-zinc-300 uppercase tracking-wider text-accent">{formatDate(event.date)}</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
            <p className="text-sm mb-4">
                at <span className="font-medium">{event.location}</span>
            </p>
            {event.bannerImageURL && (
                <div className="mb-4">
                    <img
                        src={event.bannerImageURL}
                        alt={`${event.title} banner`}
                        className="w-full h-48 object-cover"
                    />
                </div>
            )}
            <p className="luxury-text text-zinc-400 mb-6">{event.description.slice(0, 100)}...</p>
            <div className="flex flex-wrap gap-3">
                <Button
                    href={`/events/${event.id}`}
                    variant="primary"
                    size="large"
                    className="inline-block bg-black text-white text-3xl"
                >
                    View
                </Button>
            </div>
        </motion.div>
    );
};

export default EventCard; 