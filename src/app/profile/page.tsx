'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Loader from "@/components/ui/PixelLoader"

export default function ProfileRedirectPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                // Redirect to auth page if not authenticated
                router.push('/auth');
            } else if (user?.username) {
                // Redirect to public profile if user has username
                router.push(`/profile/${user.username}`);
            } else {
                // User doesn't have username yet (existing user from before username feature)
                // Redirect to edit profile to set username
                console.log('User authenticated but no username found, redirecting to edit profile');
                router.push('/profile/edit?setupUsername=true');
            }
        }
    }, [isLoading, isAuthenticated, user, router]);

    // Show loading state while checking authentication and redirecting
    return (
        <>
            <Header />
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader text='Redirecting to your profile...' />
            </div>
            <Footer />
        </>
    );
} 