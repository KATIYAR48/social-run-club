'use client';

import { useAdmin } from '@/lib/admin-context';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Loader from '@/components/ui/PixelLoader';

export default function AdminDashboard() {
    const { adminUser, isSuperAdmin, isLoading } = useAdmin();

    if (isLoading) {
        return (
            <Loader />
        );
    }

    const navItems = [
        { name: 'Events', href: '/admin/events', description: 'Manage and view events.' },
        { name: 'Registrations', href: '/admin/event-registrations', description: 'View and manage event registrations.' },
        { name: 'Check-In', href: '/admin/event-check-in', description: 'Check in attendees for events.' },
        { name: 'Volunteers', href: '/admin/volunteers', description: 'Manage volunteers.' },
        ...(isSuperAdmin ? [{ name: 'Banner', href: '/admin/banner', description: 'Manage the home page banner.' }] : []),
        ...(isSuperAdmin ? [{ name: 'Users', href: '/admin/users', description: 'Manage all users (super-admin only).' }] : []),
        ...(isSuperAdmin ? [{ name: 'Notifications', href: '/admin/notifications', description: 'Send push notifications to users.' }] : []),
        ...(isSuperAdmin ? [{ name: 'Merch Waitlist', href: '/admin/merch-waitlist', description: 'Manage merch waitlist.' }] : []),
    ];

    return (
        <div className="min-h-[70vh] flex flex-col items-start justify-center bg-black text-white">
            <div className="mb-8">
                <div className="flex items-start md:items-center gap-2">
                    <img src="/android-chrome-512x512.png" className='mb-3 w-24 h-24' alt="Admin Icon" width={500} height={500} />
                    <div className="ml-4 flex flex-col items-start justify-start gap-2">
                        <h1 className="text-3xl md:text-5xl font-bold">
                            Hello, {adminUser?.name || 'Admin'}
                        </h1>
                        <div className="text-lg md:text-xl font-normal">Here&apos;s what you can do as a <Link href='/' className='font-bold'>Cloka</Link> Admin</div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8 w-full max-w-5xl">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'block bg-gradient-to-tl from-black to-zinc-700 rounded-lg shadow-md p-6 hover:invert filter transition-all duration-300',
                                'text-start cursor-pointer'
                            )}
                        >
                            <div className="text-lg font-semibold mb-2">{item.name}</div>
                            <div className="text-zinc-400 text-sm">{item.description}</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
} 