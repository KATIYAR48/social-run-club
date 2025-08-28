'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { useRouter } from 'next/navigation';
import PageTransition from '@/components/PageTransition';

interface BannerFormData {
    content: string;
    isActive: boolean;
    backgroundColor: string;
    textColor: string;
    buttonText: string;
    buttonLink: string;
}

export default function BannerAdminPage() {
    const { isSuperAdmin, isLoading } = useAdmin();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [currentBanner, setCurrentBanner] = useState<BannerData | null>(null);

    const [formData, setFormData] = useState<BannerFormData>({
        content: '',
        isActive: true,
        backgroundColor: '#000000',
        textColor: '#ffffff',
        buttonText: '',
        buttonLink: ''
    });

    useEffect(() => {
        if (!isLoading && !isSuperAdmin) {
            router.push('/admin');
        }
    }, [isSuperAdmin, isLoading, router]);

    useEffect(() => {
        fetchCurrentBanner();
    }, []);

    const fetchCurrentBanner = async () => {
        try {
            const response = await fetch('/api/banner');
            if (response.ok) {
                const data = await response.json();
                if (data.banner) {
                    setCurrentBanner(data.banner);
                    setFormData({
                        content: data.banner.content || '',
                        isActive: data.banner.isActive ?? true,
                        backgroundColor: data.banner.backgroundColor || '#000000',
                        textColor: data.banner.textColor || '#ffffff',
                        buttonText: data.banner.buttonText || '',
                        buttonLink: data.banner.buttonLink || ''
                    });
                }
            }
        } catch {
            console.error('Error fetching current banner');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            const response = await fetch('/api/admin/banner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setMessage('Banner updated successfully!');
                fetchCurrentBanner();
            } else {
                const errorData = await response.json();
                setMessage(`Error: ${errorData.error || 'Failed to update banner'}`);
            }
        } catch {
            setMessage('Error: Failed to update banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isSuperAdmin) {
        return null;
    }

    return (
        <PageTransition variant="admin">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">HomePage Banner</h1>
                    <p className="text-zinc-400">
                        Edit the CTA banner that appears on the homepage. Content appears on the left, button on the right. This will completely replace any existing banner.
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.includes('Error')
                        ? 'bg-red-900/20 border border-red-800 text-red-200'
                        : 'bg-green-900/20 border border-green-800 text-green-200'
                        }`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Content *
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            required
                            maxLength={500}
                            rows={4}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter banner content"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Background Color
                            </label>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    name="backgroundColor"
                                    value={formData.backgroundColor}
                                    onChange={handleInputChange}
                                    className="w-16 h-10 rounded border border-zinc-700 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    name="backgroundColor"
                                    value={formData.backgroundColor}
                                    onChange={handleInputChange}
                                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Text Color
                            </label>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    name="textColor"
                                    value={formData.textColor}
                                    onChange={handleInputChange}
                                    className="w-16 h-10 rounded border border-zinc-700 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    name="textColor"
                                    value={formData.textColor}
                                    onChange={handleInputChange}
                                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="#ffffff"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Button Text
                            </label>
                            <input
                                type="text"
                                name="buttonText"
                                value={formData.buttonText}
                                onChange={handleInputChange}
                                maxLength={50}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter button text (optional)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Button Link
                            </label>
                            <input
                                type="url"
                                name="buttonLink"
                                value={formData.buttonLink}
                                onChange={handleInputChange}
                                maxLength={500}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://example.com (optional)"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 bg-zinc-800 border-zinc-700 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label className="text-sm font-medium text-white">
                            Active (show banner on homepage)
                        </label>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Updating...' : 'Update Banner'}
                        </button>
                    </div>
                </form>

                {currentBanner && (
                    <div className="mt-12 p-6 bg-zinc-800 rounded-lg">
                        <h3 className="text-xl font-semibold text-white mb-4">Current Banner Preview</h3>
                        <div
                            className="p-6 rounded-lg flex items-center justify-between gap-6"
                            style={{
                                backgroundColor: currentBanner.backgroundColor || '#000000',
                                color: currentBanner.textColor || '#ffffff'
                            }}
                        >
                            <div className="flex-1">
                                <p className="text-lg opacity-80">{currentBanner.content}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <span className="inline-block bg-white text-black px-6 py-2 rounded font-semibold">
                                    {currentBanner.buttonText}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-400 mt-3">
                            Last updated: {new Date(currentBanner.updatedAt).toLocaleString()}
                        </p>
                    </div>
                )}
            </div>
        </PageTransition>
    );
}
