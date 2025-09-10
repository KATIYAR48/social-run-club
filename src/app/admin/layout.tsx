'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAdmin, AdminProvider } from '@/lib/admin-context';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import PageTransition from '@/components/PageTransition';

function AdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAdmin, isSuperAdmin, adminUser, logout, isLoading: adminLoading } = useAdmin();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isLoading = adminLoading || authLoading;

    useEffect(() => {
        // Only redirect if we're sure both auth states have been loaded
        if (!isLoading) {
            if (!isAuthenticated) {
                // If not authenticated at all, redirect to main auth
                router.push('/auth?redirect=' + pathname);
            } else if (!isAdmin) {
                // If authenticated but not admin, redirect to main auth
                router.push('/auth?redirect=' + pathname);
            }
        }
    }, [isAdmin, isAuthenticated, isLoading, pathname, router, user?.role]);

    // Close dropdown on click outside
    useEffect(() => {
        if (!isMenuOpen) return;
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    // Show loading state while checking auth status
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render the admin layout for non-admins
    if (!isAdmin && !isAuthenticated) {
        return null;
    }

    const handleNavigation = (href: string) => {
        if (pathname !== href) {
            setIsMenuOpen(false);
            router.push(href);
        }
    };

    // Navigation items
    const navItems = [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Events', href: '/admin/events' },
        { name: 'Registrations', href: '/admin/event-registrations' },
        ...(isSuperAdmin ? [{ name: 'Users', href: '/admin/users' }] : []),
        ...(isSuperAdmin ? [{ name: 'Banner', href: '/admin/banner' }] : []),
        { name: 'Volunteers', href: '/admin/volunteers' },
        { name: 'Notifications', href: '/admin/notifications' },
    ];

    return (
        <div className="min-h-screen bg-black">
            {/* Header Navigation */}
            <header className="relative z-50">
                <div className="backdrop-blur-md text-white p-4">
                    <div className="container mx-auto flex justify-between items-center relative">
                        <div className="flex items-center space-x-2">
                            <Link href="/" className="">
                                <Image
                                    src="/logo.png"
                                    alt="CLOKA Logo"
                                    width={100}
                                    height={100}
                                    className="h-auto invert md:-ml-4"
                                />
                            </Link>
                            <h1 className="text-xl font-bold">Admin</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Hamburger and dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-2 rounded-md text-white hover:bg-zinc-800 focus:outline-none hover:cursor-pointer"
                                    aria-label="Toggle menu"
                                >
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        {isMenuOpen ? (
                                            <path d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                            <path d="M4 6h16M4 12h16M4 18h16" />
                                        )}
                                    </svg>
                                </button>
                                {isMenuOpen && (
                                    <div
                                        ref={dropdownRef}
                                        className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-[9999]"
                                    >
                                        <div className="p-4 flex flex-col space-y-2">
                                            <nav className="flex flex-col space-y-2">
                                                {isAdmin && (
                                                    <div className="text-sm text-zinc-400">
                                                        {adminUser?.email}
                                                    </div>
                                                )}

                                                {navItems.map((item) => (
                                                    <button
                                                        key={item.href}
                                                        onClick={() => handleNavigation(item.href)}
                                                        className={cn(
                                                            'cursor-pointer w-full px-3 py-2 text-base font-medium text-left rounded transition-colors',
                                                            pathname === item.href
                                                                ? 'text-white bg-zinc-800'
                                                                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                                                        )}
                                                    >
                                                        {item.name}
                                                    </button>
                                                ))}
                                                {isAdmin && isSuperAdmin && (
                                                    <button
                                                        onClick={logout}
                                                        className="cursor-pointer w-full px-3 py-2 text-base font-medium text-left rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                                                    >
                                                        Logout
                                                    </button>
                                                )}
                                            </nav>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="container mx-auto text-white">
                    <Suspense fallback={
                        <PageTransition variant="admin">
                            <div />
                        </PageTransition>
                    }>
                        <PageTransition variant="admin">
                            {children}
                        </PageTransition>
                    </Suspense>
                </div>
            </main>
        </div>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminProvider>
            <Suspense fallback={<div>Loading...</div>}>
                <PageTransition>
                    <AdminLayoutContent>{children}</AdminLayoutContent>
                </PageTransition>
            </Suspense>
        </AdminProvider>
    );
} 