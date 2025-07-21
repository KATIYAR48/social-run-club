'use client';

import { useAdmin } from '@/lib/admin-context';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
    const { adminUser, isSuperAdmin, isLoading } = useAdmin();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    const navItems = [
        { name: 'Events', href: '/admin/events', description: 'Manage and view events.' },
        { name: 'Registrations', href: '/admin/event-registrations', description: 'View and manage event registrations.' },
        { name: 'Check-In', href: '/admin/event-check-in', description: 'Check in attendees for events.' },
        ...(isSuperAdmin ? [{ name: 'Users', href: '/admin/users', description: 'Manage all users (super-admin only).' }] : []),
        { name: 'Volunteers', href: '/admin/volunteers', description: 'Manage volunteers.' },
        { name: 'Notifications', href: '/admin/notifications', description: 'Send push notifications to users.' },
        ...(isSuperAdmin ? [{ name: 'Merch Waitlist', href: '/admin/merch-waitlist', description: 'Manage merch waitlist.' }] : []),
    ];

    return (
        <div className="min-h-screen flex flex-col items-start justify-center bg-black text-white">
            <div className="mb-8">
                <div className="flex items-center gap-2">
                    <img src="/android-chrome-512x512.png" className='mb-3 w-24 h-24' alt="Admin Icon" width={500} height={500} />
                    <div className="ml-4 flex flex-col items-start justify-start gap-2">
                        <h1 className="text-6xl font-bold">
                            Hello, {adminUser?.name || 'Admin'}
                        </h1>
                        <div className="text-2xl font-normal">Here&apos;s what you can do as a <Link href='/' className='font-bold'>Cloka</Link> Admin</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 w-full max-w-4xl">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'block bg-zinc-900 rounded-lg shadow-md p-6 hover:bg-zinc-800 transition-colors border border-zinc-700',
                                'text-start cursor-pointer'
                            )}
                        >
                            <div className="text-xl font-semibold mb-2">{item.name}</div>
                            <div className="text-zinc-400 text-sm">{item.description}</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
} 