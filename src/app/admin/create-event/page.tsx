'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Loader from "@/components/ui/PixelLoader"

export default function CreateEventPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        exactLocation: '',
    });

    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            // Combine date and time
            const dateTime = new Date(`${formData.date}T${formData.time}`);

            // Create request body
            const requestBody = {
                title: formData.title,
                description: formData.description,
                date: dateTime.toISOString(),
                location: formData.location,
                exactLocation: formData.exactLocation || null,
            };

            // Send request to API
            const response = await fetch('/api/events/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create event');
            }

            // Show success message
            setSuccess('Event created successfully!');

            // Reset form
            setFormData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                exactLocation: '',
            });

            // Redirect to events page after a delay
            setTimeout(() => {
                router.push('/events');
            }, 2000);

        } catch (error) {
            console.error('Error creating event:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
        router.push('/auth?redirect=/admin/create-event');
        return null;
    }

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <Loader />
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen bg-black text-white py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Create New Event</h1>

                    {error && (
                        <div className="bg-red-900 text-red-200 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-900 text-green-200 p-4 rounded-lg mb-6">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">
                                Event Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-zinc-300 mb-1">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-zinc-300 mb-1">
                                    Time *
                                </label>
                                <input
                                    type="time"
                                    id="time"
                                    name="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-zinc-300 mb-1">
                                Location *
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                placeholder="e.g., San Francisco, CA"
                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                            />
                        </div>

                        <div>
                            <label htmlFor="exactLocation" className="block text-sm font-medium text-zinc-300 mb-1">
                                Exact Location (Optional)
                            </label>
                            <input
                                type="text"
                                id="exactLocation"
                                name="exactLocation"
                                value={formData.exactLocation}
                                onChange={handleChange}
                                placeholder="e.g., Golden Gate Park, Main Entrance"
                                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Creating Event...' : 'Create Event'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </>
    );
} 