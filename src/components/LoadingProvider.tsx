'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Loader from '@/components/ui/PixelLoader';

interface LoadingContextType {
    isLoading: boolean;
    startLoading: (message?: string) => void;
    stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}

interface LoadingProviderProps {
    children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

    const startLoading = (message?: string) => {
        setLoadingMessage(message);
        setIsLoading(true);
    };

    const stopLoading = () => {
        setIsLoading(false);
        setLoadingMessage(undefined);
    };

    return (
        <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                        <Loader text={loadingMessage as string} />
                        {loadingMessage && (
                            <p className="mt-4 text-zinc-700">{loadingMessage as string}</p>
                        )}
                    </div>
                </div>
            )}
        </LoadingContext.Provider>
    );
} 