import { motion } from 'framer-motion';
import Button from './Button';
import {
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/solid';
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
        month: 'long',
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
                className="bg-zinc-900 rounded-[10px] shadow filter hover:invert-100 transition-all duration-400 flex flex-col md:flex-row gap-5 text-white p-6"
            >
                {event.bannerImageURL ? (
                    <div className="w-full max-w-[9rem] order-2 md:order-1">
                        <img
                            src={event.bannerImageURL}
                            alt={`${event.title} banner`}
                            className="w-full object-cover filter saturate-0 hover:saturate-100 transition-all duration-300"
                        />
                    </div>
                ) : (
                    <div className="order-2 md:order-1">
                        <img
                            src='logo.png'
                            alt={`${event.title} banner`}
                            className="bg-white h-24 w-24 object-cover"
                        />
                    </div>
                )}
                <div className="flex-1 order-1 md:order-2">
                    <div className="flex h-full justify-between items-start">
                        <div className='flex-col'>
                            <div className="text-sm mb-1 text-zinc-400 uppercase tracking-wider text-accent">
                                {formatDate(event.date)}
                            </div>
                            <h3 className="text-xl font-bold mb-5">{event.title}</h3>
                            <p className="text-md text-zinc-400">
                                at <span className="font-medium">{event.location}</span>
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            size="small"
                            className="flex items-center gap-2 !text-zinc-300 border border-zinc-600"
                        >
                            Go <ArrowTopRightOnSquareIcon className='!text-zinc-400 h-5 w-5 mb-1' />
                        </Button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default EventCard; 