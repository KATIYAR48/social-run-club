'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventsPageClient from '@/components/EventsPageClient';

export default function EventsPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white py-12 px-4">
                <div className="luxury-container">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                        <h1 className="text-5xl font-bold">Events</h1>
                        <p className="text-xl text-zinc-400 mt-2 md:mt-0">
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