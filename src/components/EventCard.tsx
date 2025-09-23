import { motion } from 'framer-motion';
import Link from 'next/link'


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
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

const EventCard = ({ event }: { event: EventCardProps }) => {
    return (
        <Link href={`/events/${event.id}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="h-full flex md:flex-row gap-5 rounded-md hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] shadow-white p-4 bg-zinc-800 hover:bg-white hover:text-black border border-zinc-700 hover:border-white transition-all duration-300"
            >
                {event.bannerImageURL ? (
                    <div className="h-[6rem] w-[6rem] flex-shrink-0 overflow-hidden rounded-md bg-zinc-800">
                        <img
                            src={event.bannerImageURL}
                            alt={`${event.title} banner`}
                            className="h-full w-full object-cover filter saturate-0 hover:saturate-100 transition-all duration-300"
                        />
                    </div>
                ) : (
                    <div className="h-[6rem] border border-zinc-600 w-[6rem] flex-shrink-0 overflow-hidden rounded-md bg-white flex items-center justify-center">
                        <img
                            src='logo.png'
                            alt={`${event.title} banner`}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}
                <div className="grid grid-cols-1 order-1 md:order-2 justify-between">
                    <div className="flex flex-col justify-between h-full">
                        <div className='mb-2'>
                            <div className="mb-2 text-xs text-zinc-400 uppercase tracking-wider text-accent">
                                {formatDate(event.date)}
                            </div>
                            <h3 className="text-md md:text-lg font-bold">{event.title}</h3></div>
                        <p className="text-sm text-zinc-400">
                            at <span className="font-medium">{event.location}</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default EventCard; 