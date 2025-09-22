'use client';

import { useSmoothScroll } from '@/lib/hooks/useSmoothScroll';

export default function SmoothScrollExample() {
    const { scrollTo, scrollToTop } = useSmoothScroll();

    const handleScrollToSection = (sectionId: string) => {
        scrollTo(`#${sectionId}`, { offset: -80, duration: 1.5 });
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <button
                onClick={scrollToTop}
                className="bg-black text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
                ↑ Top
            </button>
            <button
                onClick={() => handleScrollToSection('hero')}
                className="bg-black text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
                Hero
            </button>
            <button
                onClick={() => handleScrollToSection('events')}
                className="bg-black text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
                Events
            </button>
        </div>
    );
}
