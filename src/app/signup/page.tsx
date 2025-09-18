'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from '@/components/ui/PixelLoader';

function SignupRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Get all current search params
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
            params.append(key, value);
        });

        // Add the signup mode
        params.set('mode', 'signup');

        // Redirect to the new auth page
        router.replace(`/auth${params.toString() ? '?' + params.toString() : ''}`);
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <Loader text="Redirecting to signup page..." />
        </div>
    );
}

export default function SignupRedirect() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader text="Loading..." />
            </div>
        }>
            <SignupRedirectContent />
        </Suspense>
    );
} 