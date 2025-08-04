import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventRegistrationButton from '@/components/EventRegistrationButton';
import TemporaryPaymentButton from '@/components/TemporaryPaymentButton';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import { checkEventRegistration } from '@/lib/event-utils';
import { cookies } from 'next/headers';
import EventLocalDate from '@/components/EventLocalDate';
import Image from 'next/image';

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

    // Fetch the event
    const event = await Event.findById(resolvedParams.id);

    if (!event) {
        notFound();
    }

    // Check if the user is registered for this event
    const { isRegistered, isApproved } = await checkEventRegistration(resolvedParams.id);

    // Check if user is logged in
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("cloka_auth");
    const isLoggedIn = !!(authCookie && authCookie.value);

    // Check if event is in the past
    // Consider the event as "past" only if it's more than 2 hours ago
    const isPastEvent = new Date(event.date).getTime() + 2 * 60 * 60 * 1000 < Date.now();

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white py-12 px-4">
                <div className="luxury-container">
                    <Link href="/events" className="inline-flex items-center text-zinc-400 hover:text-white mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Events
                    </Link>

                    <div className="bg-black text-white luxury-border">
                        {/* Event Header */}
                        <div className={`relative w-full ${event.bannerImageURL ? 'h-[32rem]' : 'h-96'}`}>
                            {event.bannerImageURL ? (
                                <Image
                                    src={event.bannerImageURL}
                                    alt={event.title}
                                    className="absolute inset-0 w-full h-full object-cover object-[center_33%]"
                                    width={1200}
                                    height={512}
                                    unoptimized
                                />
                            ) : (
                                <video
                                    src="/teaser.MP4"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                            <div className="absolute bottom-0 left-2 p-6">
                                <h1 className="text-3xl md:text-4xl font-bold text-white">{event.title}</h1>
                                <p className="text-zinc-300 mt-2">
                                    <EventLocalDate date={event.date} />
                                </p>
                            </div>
                        </div>

                        {/* Event Content */}
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="md:w-2/3">
                                    <h2 className="text-xl font-bold mb-4">About This Event</h2>
                                    <p className="text-zinc-300 whitespace-pre-line">{event.description}</p>

                                    <div className="mt-8">
                                        <h2 className="text-xl font-bold mb-4">Location</h2>
                                        {isApproved === true ? (
                                            <>
                                                <p className="text-zinc-300">{event.location}</p>
                                                {isLoggedIn && event.exactLocation && (
                                                    <div className="mt-4 p-4 bg-zinc-900 luxury-border">
                                                        <h3 className="text-lg font-semibold mb-2">Exact Location</h3>
                                                        <p className="text-zinc-300 break-words">{event.exactLocation}</p>
                                                        {event.exactLocation.includes("maps.google.com") ||
                                                            event.exactLocation.includes("goo.gl/maps") ||
                                                            event.exactLocation.includes("maps.app.goo.gl") ? (
                                                            <a
                                                                href={event.exactLocation}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-2 inline-block luxury-button"
                                                            >
                                                                Open in Google Maps
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                )}

                                                {/* Display post-approval message if available */}
                                                {event.postApprovalMessage && (
                                                    <div className="mt-4 p-4 bg-zinc-900 luxury-border">
                                                        <h3 className="text-lg font-semibold mb-2">Important Information</h3>
                                                        <p className="text-zinc-300 whitespace-pre-line">{event.postApprovalMessage}</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="p-4 bg-zinc-900 luxury-border">
                                                <p className="text-zinc-300 whitespace-pre-line">
                                                    {isRegistered ? (
                                                        isApproved === false ? (
                                                            event.postRejectionMessage ||
                                                            "Hey Runner,\n\nWe're so grateful for your energy and excitement! \nThis time, we couldn't fit everyone in, but don't sweat it—we're lacing up for the next run soon, and we can't wait to see you there.\n\nKeep that spirit high, and we'll be running together before you know it!\n\nMuch love,\nThe Cloka Team"
                                                        ) : (
                                                            "Your registration is pending approval. Location details will be available once approved."
                                                        )
                                                    ) : (
                                                        "Register for this event to view location details."
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                        {!isLoggedIn && event.exactLocation && (
                                            <div className="mt-4 p-4 bg-zinc-900 luxury-border">
                                                <p className="text-zinc-300">
                                                    <Link href={`/auth?redirect=/events/${resolvedParams.id}`} className="text-accent hover:underline">
                                                        Log in
                                                    </Link> to see the exact location details.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="md:w-1/3">
                                    <div className="bg-zinc-900 luxury-border p-6">
                                        <h2 className="text-xl font-bold mb-4">Registration</h2>
                                        {isPastEvent ? (
                                            <div className="p-3 bg-zinc-800 text-zinc-300 rounded-md">
                                                This event has already taken place.
                                            </div>
                                        ) : (
                                            <>
                                                <EventRegistrationButton
                                                    eventId={resolvedParams.id}
                                                    isRegistered={isRegistered}
                                                    isApproved={isApproved}
                                                    isPastEvent={isPastEvent}
                                                    additionalInfoField={event.additionalInfoField ? {
                                                        label: event.additionalInfoField.label,
                                                        required: event.additionalInfoField.required,
                                                        fieldType: event.additionalInfoField.fieldType,
                                                        options: event.additionalInfoField.options
                                                    } : undefined}
                                                />

                                                {/* Show payment button if approved and razorpayButtonId exists */}
                                                {isApproved && event.razorpayButtonId && (
                                                    <div className="mt-4 p-4 bg-zinc-800 rounded-md">
                                                        <h3 className="text-lg font-semibold mb-2">Payment</h3>
                                                        <p className="text-zinc-300 mb-4">Complete your payment to confirm your spot. Ignore this if you have already paid.</p>
                                                        <TemporaryPaymentButton paymentButtonId={event.razorpayButtonId} />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
} 