'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '@/components/ui/PixelLoader';

interface PageTransitionProps {
    children: React.ReactNode;
    variant?: 'default' | 'admin';
}

export default function PageTransition({ children, }: PageTransitionProps) {
    const pathname = usePathname();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        setIsTransitioning(true);
        setShouldRender(true);

        const timer = setTimeout(() => {
            setIsTransitioning(false);
            // Add a small delay before removing the loader from DOM to ensure smooth transitions
            setTimeout(() => {
                setShouldRender(false);
            }, 200);
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [pathname]);

    const LoaderComponent = <div className="fixed inset-0 bg-black z-40 flex items-center justify-center">
        <Loader />
    </div>

    return (
        <>
            {shouldRender && isTransitioning && LoaderComponent}
            <div className={isTransitioning ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}>
                {children}
            </div>
        </>
    );
} 