'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Text, Metric } from "@tremor/react";

interface WaitlistEntry {
    _id: string;
    name: string;
    email: string;
    phone: string;
    preferredMerch: string;
    size?: string;
    colorPreference?: string;
    instagramUsername?: string;
    additionalInfo?: string;
    status: string;
    createdAt: string;
}

export default function MerchWaitlistPage() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch waitlist entries
    const fetchEntries = async () => {
        try {
            setIsLoadingData(true);
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && { status: statusFilter })
            });

            const response = await fetch(`/api/merch-waitlist?${queryParams}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch waitlist entries');
            }

            setEntries(data.data.entries);
            setTotalPages(data.data.pagination.totalPages);
            setTotalEntries(data.data.pagination.total);
        } catch (error) {
            console.error('Error fetching waitlist entries:', error);
            setError(error instanceof Error ? error.message : 'An error occurred while fetching data');
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && (user?.role === 'admin' || user?.role === 'super-admin')) {
            fetchEntries();
        }
    }, [isAuthenticated, user, page, searchTerm, statusFilter, fetchEntries]);

    // Redirect if not authenticated or not admin
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin' && user?.role !== 'super-admin')) {
        router.push('/auth?redirect=/admin/merch-waitlist');
        return null;
    }

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                        <p className="mt-4">Loading...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'waiting':
                return 'yellow';
            case 'contacted':
                return 'blue';
            case 'completed':
                return 'green';
            default:
                return 'gray';
        }
    };

    return (
        <>
            <main className="min-h-screen bg-black text-white py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">Merch Waitlist</h1>
                        <div className="mt-4 md:mt-0">
                            <Card className="bg-zinc-900 border-zinc-700">
                                <Text>Total Entries</Text>
                                <Metric className='text-2xl font-bold'>{isLoadingData ? '...' : totalEntries}</Metric>
                            </Card>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900 text-red-200 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search by name, email, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white flex-1"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                        >
                            <option value="">All Status</option>
                            <option value="waiting">Waiting</option>
                            <option value="contacted">Contacted</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="">
                        <Card className="overflow-x-auto bg-zinc-900 border-zinc-700 min-w-[1000px]">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeaderCell>Name</TableHeaderCell>
                                        <TableHeaderCell>Email</TableHeaderCell>
                                        <TableHeaderCell>Phone</TableHeaderCell>
                                        <TableHeaderCell>Preferred Merch</TableHeaderCell>
                                        <TableHeaderCell>Size</TableHeaderCell>
                                        <TableHeaderCell>Color</TableHeaderCell>
                                        <TableHeaderCell>Instagram</TableHeaderCell>
                                        <TableHeaderCell>Status</TableHeaderCell>
                                        <TableHeaderCell>Date</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoadingData ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : entries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center">
                                                No entries found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        entries.map((entry) => (
                                            <TableRow key={entry._id}>
                                                <TableCell>{entry.name}</TableCell>
                                                <TableCell>{entry.email}</TableCell>
                                                <TableCell>{entry.phone}</TableCell>
                                                <TableCell>{entry.preferredMerch}</TableCell>
                                                <TableCell>{entry.size || '-'}</TableCell>
                                                <TableCell>{entry.colorPreference || '-'}</TableCell>
                                                <TableCell>{entry.instagramUsername || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge color={getStatusColor(entry.status)}>
                                                        {entry.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(entry.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
} 