'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventsPageClient from './client-page';

export default function EventsPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white py-12 px-4">
                <div className="md:container md:mx-auto mx-5">
                    <div className="border-b border-zinc-800 pb-3 flex flex-col md:flex-row justify-between items-center mb-5">
                        <h1 className="text-2xl font-bold">Events</h1>
                        <p className="text-md md:max-w-lg max-w-xs text-zinc-400 mt-2 md:mt-0 md:text-end text-center">
                            Join us for exciting events and connect with the community
                        </p>
                    </div>

                    <EventsPageClient />
                </div>
            </main>
            <Footer />
        </>
    );
} 