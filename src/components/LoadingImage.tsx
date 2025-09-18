'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Loader from '@/components/ui/PixelLoader';

interface LoadingImageProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    priority?: boolean;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export default function LoadingImage({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    objectFit = 'cover',
}: LoadingImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    return (
        <div className={`relative ${className}`} style={{ width, height }}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                    <Loader />
                </div>
            )}

            {hasError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 text-zinc-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Image not available</p>
                </div>
            ) : (
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    onLoad={handleLoad}
                    onError={handleError}
                    priority={priority}
                    style={{
                        objectFit,
                        opacity: isLoading ? 0 : 1,
                        transition: 'opacity 0.3s ease-in-out'
                    }}
                />
            )}
        </div>
    );
} 