'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BannerData {
    content: string;
    isActive: boolean;
    backgroundColor?: string;
    textColor?: string;
    buttonText: string;
    buttonLink: string;
}

export default function HomePageBanner() {
    const [banner, setBanner] = useState<BannerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const response = await fetch('/api/banner');
                if (response.ok) {
                    const data = await response.json();
                    if (data.banner && data.banner.isActive) {
                        setBanner(data.banner);
                    }
                }
            } catch (error) {
                console.error('Error fetching banner:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBanner();
    }, []);

    if (isLoading || !banner) {
        return null;
    }

    return (
        <div
            className="w-full py-8 px-4"
            style={{ backgroundColor: banner.backgroundColor || '#000000' }}
        >
            <div className="container mx-auto">
                <div
                    className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6"
                    style={{ color: banner.textColor || '#ffffff' }}
                >
                    <div className="flex-1 text-left">
                        <p className="text-xl md:text-2xl leading-relaxed opacity-90">
                            {banner.content}
                        </p>
                    </div>

                    <div className="flex-shrink-0">
                        <Link
                            href={banner.buttonLink}
                            className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                        >
                            {banner.buttonText}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
