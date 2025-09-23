'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Image from 'next/image';

interface FormData {
    name: string;
    organizationName: string;
    email: string;
    phone: string;
    links: string;
    cities: string;
    description: string;
    collaborationType: string;
    pastCollaboration: string;
    collaborationReason: string;
    additionalInfo: string;
}

export default function PartnershipsPage() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        organizationName: '',
        email: '',
        phone: '',
        links: '',
        cities: '',
        description: '',
        collaborationType: '',
        pastCollaboration: '',
        collaborationReason: '',
        additionalInfo: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/partnerships', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Thank you for your partnership inquiry. We will get back to you soon!');
                setFormData({
                    name: '',
                    organizationName: '',
                    email: '',
                    phone: '',
                    links: '',
                    cities: '',
                    description: '',
                    collaborationType: '',
                    pastCollaboration: '',
                    collaborationReason: '',
                    additionalInfo: '',
                });
            } else {
                setError(data.message || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow">
                {/* Hero Section */}
                <div className="md:container md:mx-auto mx-5 px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <section className="text-center space-y-4">
                            <h1 className="text-2xl font-bold">Partner with Cloka</h1>
                            <p className="text-md text-gray-300">Let&apos;s Build Something Inspiring, Together</p>
                            <div className="max-w-3xl mx-auto">
                                <p className="text-zinc-400 text-sm">
                                    We&apos;re a growing community built on movement, motivation, and meaningful connections. Whether you&apos;re a local café, a creative collective, a wellness brand, or a community-first initiative—we&apos;re always looking to collaborate with people and organizations that share our spirit.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>



                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Why Partner Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Portrait Image Section */}
                            <section className="relative w-full aspect-[3/4]">
                                <Image
                                    src="/images/reels.png"
                                    alt="Cloka Community Moments"
                                    fill
                                    className="object-cover rounded-lg shadow-lg"
                                    priority
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            </section>
                            <section className="bg-gradient-to-tr from-zinc-700 to-zinc-900 rounded-lg p-8">
                                <h2 className="text-xl font-bold mb-6">Why Partner with Cloka?</h2>
                                <ul className="space-y-4 text-sm text-zinc-300 font-light">
                                    <li>• <strong>Tap into a 7,000+ strong engaged community</strong> across India&apos;s top cities.</li>
                                    <li>• <strong>Get featured in our events, merch drops, reels, and stories</strong> on Instagram and our mobile app, reaching over 16,000+ followers.</li>
                                    <li>• <strong>Create value-driven local experiences</strong> that bring your brand or idea to life.</li>
                                    <li>• <strong>Join forces on CSR, wellness, art, or fitness initiatives</strong> that align with your ethos.</li>
                                </ul>
                            </section>
                        </div>

                        {/* Who Should Collaborate Section */}
                        <section className="bg-gradient-to-tr from-zinc-700 to-zinc-900 rounded-lg p-8 ">
                            <h2 className="text-xl font-bold mb-6">Who Should Collaborate?</h2>
                            <p className="mb-4 text-sm">We love teaming up with:</p>
                            <ul className="space-y-2 text-gray-300 text-sm">
                                <li>• Cafés & Eateries (perfect for our post-run community meetups)</li>
                                <li>• Fitness brands, nutritionists & wellness experts</li>
                                <li>• Local artists, musicians, theatre collectives</li>
                                <li>• Sustainable fashion or lifestyle labels</li>
                                <li>• NGOs, CSR projects, or hyper-local initiatives</li>
                            </ul>
                            <p className="mt-4 text-gray-400">If you believe your vibe fits our tribe—we&apos;re all ears.</p>
                        </section>

                        {/* Community Image - Full Width */}
                        <section className="w-full container mx-auto relative aspect-[21/9] mb-12">
                            <Image
                                src="/images/partner.png"
                                alt="Cloka Community"
                                fill
                                className="object-cover rounded-lg"
                                priority
                            />
                        </section>


                        {/* Partnership Form */}
                        <section className="bg-gradient-to-tr from-zinc-700 to-zinc-900 rounded-lg p-8 ">
                            <h2 className="text-xl font-bold mb-6">Interested? Let&apos;s Talk.</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-xs font-medium mb-1">Your Name *</label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="organizationName" className="block text-xs font-medium mb-1">Organization / Brand Name *</label>
                                        <input
                                            id="organizationName"
                                            name="organizationName"
                                            type="text"
                                            value={formData.organizationName}
                                            onChange={handleChange}
                                            className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="email" className="block text-xs font-medium mb-1">Email Address *</label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-xs font-medium mb-1">Phone Number *</label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Links and Cities */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="links" className="block text-xs font-medium mb-1">Website / Instagram / Relevant Links *</label>
                                        <input
                                            id="links"
                                            name="links"
                                            type="text"
                                            value={formData.links}
                                            onChange={handleChange}
                                            className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="cities" className="block text-xs font-medium mb-1">City / Cities You Operate In *</label>
                                        <input
                                            id="cities"
                                            name="cities"
                                            type="text"
                                            value={formData.cities}
                                            onChange={handleChange}
                                            className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-xs font-medium mb-1">What do you do? (Short Description of your brand / org) *</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                        required
                                    />
                                </div>

                                {/* Collaboration Type */}
                                <div>
                                    <label htmlFor="collaborationType" className="block text-xs font-medium mb-1">How do you want to collaborate with Cloka? *</label>
                                    <textarea
                                        id="collaborationType"
                                        name="collaborationType"
                                        value={formData.collaborationType}
                                        onChange={handleChange}
                                        placeholder="Eg: café meetup, co-branded event, content collab, sponsorship, CSR idea, etc."
                                        rows={3}
                                        className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                        required
                                    />
                                </div>

                                {/* Optional Fields */}
                                <div>
                                    <label htmlFor="pastCollaboration" className="block text-xs font-medium mb-1">Any Past Collaboration Example or Work We Should See? (Optional)</label>
                                    <textarea
                                        id="pastCollaboration"
                                        name="pastCollaboration"
                                        value={formData.pastCollaboration}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="collaborationReason" className="block text-xs font-medium mb-1">Why does this collab excite you? (Optional)</label>
                                    <textarea
                                        id="collaborationReason"
                                        name="collaborationReason"
                                        value={formData.collaborationReason}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="additionalInfo" className="block text-xs font-medium mb-1">Any additional info or ideas? (Optional)</label>
                                    <textarea
                                        id="additionalInfo"
                                        name="additionalInfo"
                                        value={formData.additionalInfo}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-400">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="text-green-400">
                                        {success}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    variant='secondary'
                                    disabled={isLoading}
                                    className="cursor-pointer w-full !font-bold rounded-md"
                                >
                                    {isLoading ? 'Submitting...' : 'Submit'}
                                </Button>
                            </form>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
} 