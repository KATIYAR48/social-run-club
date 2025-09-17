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
                className="bg-zinc-900 filter hover:invert-100 transition-all duration-400 flex flex-col md:flex-row gap-5 text-white p-6"
            >
                {event.bannerImageURL ? (
                    <div className="mb-4 w-full max-w-[12rem] order-2 md:order-1">
                        <img
                            src={event.bannerImageURL}
                            alt={`${event.title} banner`}
                            className="w-full h-64 object-cover filter saturate-0 hover:saturate-100 transition-all duration-300"
                        />
                    </div>
                ) : (
                    <div className="mb-4 w-full max-w-[12rem] order-2 md:order-1 filter hover:invert-100 transition-all duration-400">
                        <img
                            src='logo.png'
                            alt={`${event.title} banner`}
                            className="bg-white w-full h-64 object-cover"
                        />
                    </div>
                )}
                <div className="flex-1 order-1 md:order-2">
                    <div className="mb-4 flex justify-between items-start gap-3">
                        <div>
                            <div className="text-md text-zinc-400 uppercase tracking-wider text-accent">
                                {formatDate(event.date)}
                            </div>
                            <h3 className="text-4xl font-bold mb-2">{event.title}</h3>
                            <p className="text-xl text-zinc-400 mb-4">
                                at <span className="font-medium">{event.location}</span>
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            size="medium"
                            className="flex items-center gap-2 !text-xl !text-zinc-300 border border-zinc-600"
                        >
                            View <ArrowTopRightOnSquareIcon className='!text-zinc-400 h-5 w-5 mb-1' />
                        </Button>
                    </div>


                    <div className="luxury-text text-xl text-zinc-400 mb-6 !leading-6">
                        {event.description.slice(0, 240)}<span className='text-zinc-300'>... read more</span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default EventCard; 