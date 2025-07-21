'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Search, Filter, Download, RefreshCw, Clipboard } from 'lucide-react';
import Button from '@/components/Button';

interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    age?: number;
    sex?: string;
    instagram?: string;
}

interface Event {
    _id: string;
    title: string;
    date: string;
    location: string;
}

interface EventRegistration {
    _id: string;
    userId: string;
    eventId: string;
    approved: boolean | null;
    checkedIn: boolean;
    checkedInAt: string | null;
    createdAt: string;
    additionalInfo?: string;
    user: User | null;
    event: Event | null;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

interface SummaryData {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    checkedIn: number;
}

export default function EventRegistrationsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        limit: 50,
        pages: 0,
    });
    const [summary, setSummary] = useState<SummaryData>({
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        checkedIn: 0,
    });
    const [copyingEmails, setCopyingEmails] = useState(false);
    const [emailsCopied, setEmailsCopied] = useState(false);
    const [downloadingCSV, setDownloadingCSV] = useState(false);

    // Filters
    const [selectedEvent, setSelectedEvent] = useState(searchParams.get('eventId') || '');
    const [approvalStatus, setApprovalStatus] = useState(searchParams.get('approved') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [ageRange, setAgeRange] = useState(searchParams.get('ageRange') || '');
    const [selectedSex, setSelectedSex] = useState(searchParams.get('sex') || '');

    // Load event registrations
    const loadEventRegistrations = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());

            if (selectedEvent) {
                params.append('eventId', selectedEvent);
            }

            if (approvalStatus) {
                params.append('approved', approvalStatus);
            }

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (ageRange) {
                params.append('ageRange', ageRange);
            }

            if (selectedSex) {
                params.append('sex', selectedSex);
            }

            // Fetch event registrations
            const response = await fetch(`/api/admin/event-registrations?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setEventRegistrations(data.registrations || []);
                setPagination(data.pagination || { total: 0, page: 1, limit: 50, pages: 0 });

                // Use the stats from the same response if available
                if (data.stats) {
                    setSummary({
                        total: data.stats.total,
                        approved: data.stats.approved,
                        rejected: data.stats.rejected,
                        pending: data.stats.pending,
                        checkedIn: data.stats.checkedIn
                    });
                } else {
                    // Calculate stats from the pagination total and filtered data
                    let approvedCount = 0;
                    let rejectedCount = 0;
                    let pendingCount = 0;

                    // Count from the current page data
                    const eventRegs = data.registrations || [];
                    eventRegs.forEach((reg: EventRegistration) => {
                        if (reg.approved === true) approvedCount++;
                        else if (reg.approved === false) rejectedCount++;
                        else pendingCount++;
                    });

                    // If we're on the first page and have fewer items than the limit,
                    // we can use these counts directly
                    if (pagination.page === 1 && (data.registrations || []).length < pagination.limit) {
                        setSummary({
                            total: data.pagination?.total || 0,
                            approved: approvedCount,
                            rejected: rejectedCount,
                            pending: pendingCount,
                            checkedIn: 0
                        });
                    } else {
                        // Otherwise, we need to make an additional request to get accurate counts
                        // Clone the current params but request all items (with a high limit and no pagination)
                        const statsParams = new URLSearchParams(params);
                        statsParams.set('page', '1');
                        statsParams.set('limit', '1000000'); // Very high limit to get all items
                        statsParams.append('countOnly', 'true'); // Add a flag to indicate we only need counts

                        try {
                            const statsResponse = await fetch(`/api/admin/event-registrations?${statsParams.toString()}`);
                            const statsData = await statsResponse.json();

                            if (statsResponse.ok && statsData.counts) {
                                setSummary({
                                    total: statsData.counts.total || 0,
                                    approved: statsData.counts.approved || 0,
                                    rejected: statsData.counts.rejected || 0,
                                    pending: statsData.counts.pending || 0,
                                    checkedIn: statsData.counts.checkedIn || 0
                                });
                            } else {
                                // Fallback to using the pagination total
                                setSummary({
                                    total: data.pagination?.total || 0,
                                    approved: approvedCount,
                                    rejected: rejectedCount,
                                    pending: pendingCount,
                                    checkedIn: 0
                                });
                            }
                        } catch (statsError) {
                            console.error('Error fetching stats:', statsError);
                            // Fallback to using the pagination total
                            setSummary({
                                total: data.pagination?.total || 0,
                                approved: approvedCount,
                                rejected: rejectedCount,
                                pending: pendingCount,
                                checkedIn: 0
                            });
                        }
                    }
                }
            } else {
                setError(data.message || 'Failed to load event registrations');
            }
        } catch (error) {
            console.error('Error loading event registrations:', error);
            setError('An error occurred while loading event registrations');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, selectedEvent, approvalStatus, searchTerm, ageRange, selectedSex]);

    // Load events for filter
    const loadEvents = useCallback(async () => {
        try {
            const response = await fetch('/api/events?limit=100&sort=date&all=true');
            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || data);
            } else {
                console.error('Failed to load events');
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }, []);

    // Handle approval/rejection
    const handleApproval = async (registrationId: string, approved: boolean | null) => {
        try {
            const response = await fetch('/api/admin/event-registrations/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    registrationId,
                    approved,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Find the registration to update
                const registration = eventRegistrations.find(reg => reg._id === registrationId);

                // Update the registration in the state
                setEventRegistrations(prevRegistrations =>
                    prevRegistrations.map(reg =>
                        reg._id === registrationId ? { ...reg, approved } : reg
                    )
                );

                // Update summary counts
                if (registration) {
                    setSummary(prev => {
                        const newSummary = { ...prev };

                        // Decrement previous status count
                        if (registration.approved === true) newSummary.approved--;
                        else if (registration.approved === false) newSummary.rejected--;
                        else newSummary.pending--;

                        // Increment new status count
                        if (approved === true) newSummary.approved++;
                        else if (approved === false) newSummary.rejected++;
                        else newSummary.pending++;

                        return newSummary;
                    });
                }

                // If we have complex filters applied, refresh the data to get accurate stats
                if (searchTerm || ageRange || selectedSex) {
                    loadEventRegistrations();
                }
            } else {
                setError(data.message || 'Failed to update registration');
            }
        } catch (err) {
            setError('An error occurred while updating registration');
            console.error(err);
        }
    };

    // Handle check-in
    const handleCheckIn = async (registrationId: string) => {
        try {
            const response = await fetch('/api/admin/event-registrations/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    registrationId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Update the registration in the state
                setEventRegistrations(prevRegistrations =>
                    prevRegistrations.map(reg =>
                        reg._id === registrationId
                            ? { ...reg, checkedIn: true, checkedInAt: new Date().toISOString() }
                            : reg
                    )
                );

                // Update summary counts
                setSummary(prev => ({
                    ...prev,
                    checkedIn: prev.checkedIn + 1
                }));
            } else {
                setError(data.message || 'Failed to check in registration');
            }
        } catch (err) {
            setError('An error occurred while checking in registration');
            console.error(err);
        }
    };

    // Handle revoke check-in
    const handleRevokeCheckIn = async (registrationId: string) => {
        try {
            const response = await fetch('/api/admin/event-registrations/revoke-check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    registrationId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Update the registration in the state
                setEventRegistrations(prevRegistrations =>
                    prevRegistrations.map(reg =>
                        reg._id === registrationId
                            ? { ...reg, checkedIn: false, checkedInAt: null }
                            : reg
                    )
                );

                // Update summary counts
                setSummary(prev => ({
                    ...prev,
                    checkedIn: Math.max(prev.checkedIn - 1, 0)
                }));
            } else {
                setError(data.message || 'Failed to revoke check-in');
            }
        } catch (err) {
            setError('An error occurred while revoking check-in');
            console.error(err);
        }
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    // Handle filter change
    const handleFilterChange = () => {
        // Reset to page 1 when filters change
        setPagination(prev => ({ ...prev, page: 1 }));

        // Update URL with filters
        const params = new URLSearchParams();
        if (selectedEvent) params.append('eventId', selectedEvent);
        if (approvalStatus) params.append('approved', approvalStatus);
        if (searchTerm) params.append('search', searchTerm);
        if (ageRange) params.append('ageRange', ageRange);
        if (selectedSex) params.append('sex', selectedSex);

        router.push(`/admin/event-registrations?${params.toString()}`);
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Function to copy all email IDs to clipboard
    const copyEmailsToClipboard = async () => {
        setCopyingEmails(true);
        setEmailsCopied(false);
        setError('');

        try {
            // Build query parameters (same as loadEventRegistrations but without pagination)
            const params = new URLSearchParams();
            // Don't include page and limit to get all results
            params.append('emailsOnly', 'true'); // Add a flag to indicate we only need emails

            if (selectedEvent) {
                params.append('eventId', selectedEvent);
            }

            if (approvalStatus) {
                params.append('approved', approvalStatus);
            }

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (ageRange) {
                params.append('ageRange', ageRange);
            }

            if (selectedSex) {
                params.append('sex', selectedSex);
            }

            // Fetch all emails matching the current filters
            const response = await fetch(`/api/admin/event-registrations?${params.toString()}`);
            const data = await response.json();

            if (response.ok && data.emails) {
                // Copy emails to clipboard
                const emailText = data.emails.join('\n');
                await navigator.clipboard.writeText(emailText);

                // Show success message
                setEmailsCopied(true);

                // Reset success message after 3 seconds
                setTimeout(() => {
                    setEmailsCopied(false);
                }, 3000);
            } else {
                setError(data.message || 'Failed to fetch email addresses');
            }
        } catch (error) {
            console.error('Error copying emails:', error);
            setError('An error occurred while copying email addresses');
        } finally {
            setCopyingEmails(false);
        }
    };

    // Function to download all registration data as CSV
    const downloadAsCSV = async () => {
        setDownloadingCSV(true);
        setError('');

        try {
            // Build query parameters (same as loadEventRegistrations but without pagination)
            const params = new URLSearchParams();
            // Don't include page and limit to get all results
            params.append('format', 'csv'); // Add a flag to indicate we need all data for CSV

            if (selectedEvent) {
                params.append('eventId', selectedEvent);
            }

            if (approvalStatus) {
                params.append('approved', approvalStatus);
            }

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (ageRange) {
                params.append('ageRange', ageRange);
            }

            if (selectedSex) {
                params.append('sex', selectedSex);
            }

            // Fetch all registrations matching the current filters
            const response = await fetch(`/api/admin/event-registrations?${params.toString()}`);
            const data = await response.json();

            if (response.ok && data.registrations) {
                // Convert registrations to CSV
                const registrations = data.registrations;

                // Define CSV headers
                const headers = [
                    'Name', 'Email', 'Phone', 'Age', 'Gender', 'Instagram',
                    'Event', 'Event Date', 'Registration Date', 'Status', 'Checked In'
                ];

                // Map registrations to CSV rows
                const rows = registrations.map((reg: EventRegistration) => {
                    const user = reg.user || {} as User;
                    const event = reg.event || {} as Event;
                    const status = reg.approved === true ? 'Approved' :
                        reg.approved === false ? 'Rejected' : 'Pending';

                    return [
                        user.name || '',
                        user.email || '',
                        user.phone || '',
                        user.age || '',
                        user.sex || '',
                        user.instagram || '',
                        event.title || '',
                        event.date ? new Date(event.date).toLocaleDateString() : '',
                        reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '',
                        status,
                        reg.checkedIn ? 'Yes' : 'No'
                    ];
                });

                // Build CSV content
                const csvContent = [
                    headers.join(','),
                    ...rows.map((row: string[]) => row.map((cell: string | number | boolean) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                ].join('\n');

                // Create a blob with the CSV data
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

                // Create a URL for the blob
                const url = URL.createObjectURL(blob);

                // Create a temporary link element
                const link = document.createElement('a');
                link.href = url;

                // Set the filename - get event name or use 'all-events' + current date
                const eventName = selectedEvent
                    ? (events.find(e => e._id === selectedEvent)?.title || 'event').toLowerCase().replace(/\s+/g, '-')
                    : 'all-events';
                const date = new Date().toISOString().split('T')[0];
                link.download = `registrations-${eventName}-${date}.csv`;

                // Append the link to the document
                document.body.appendChild(link);

                // Click the link to trigger the download
                link.click();

                // Clean up
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                setError(data.message || 'Failed to fetch registration data for CSV');
            }
        } catch (error) {
            console.error('Error downloading CSV data:', error);
            setError('An error occurred while preparing registration data');
        } finally {
            setDownloadingCSV(false);
        }
    };

    // Load data on initial render and when filters/pagination change
    useEffect(() => {
        loadEvents();
        loadEventRegistrations();
    }, [loadEvents, loadEventRegistrations]);

    return (
        <div className="w-full py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-center md:text-left mb-4 md:mb-0">Event Registrations</h1>
                <div className="flex space-x-2">
                    <Button
                        onClick={copyEmailsToClipboard}
                        disabled={copyingEmails}
                        className={`flex items-center ${emailsCopied ? 'bg-green-600' : 'bg-zinc-800 hover:bg-zinc-700'} text-white px-4 py-2 rounded`}
                    >
                        {copyingEmails ? (
                            <>
                                <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                                Copying...
                            </>
                        ) : emailsCopied ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Clipboard className="h-4 w-4 mr-2" />
                                Email IDs
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={downloadAsCSV}
                        disabled={downloadingCSV}
                        className="flex items-center bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded"
                    >
                        {downloadingCSV ? (
                            <>
                                <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                CSV
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={() => loadEventRegistrations()}
                        className="flex items-center bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-zinc-900 p-4 rounded-lg mb-6">
                {/* Search bar in its own row */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, or Instagram"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 pl-10"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-64">
                        <label className="block text-sm font-medium mb-1">Event</label>
                        <select
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                        >
                            <option value="">All Events</option>
                            {events.map((event) => (
                                <option key={event._id} value={event._id}>
                                    {event.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-64">
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            value={approvalStatus}
                            onChange={(e) => setApprovalStatus(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                        >
                            <option value="">All Statuses</option>
                            <option value="true">Approved</option>
                            <option value="false">Rejected</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div className="w-full md:w-64">
                        <label className="block text-sm font-medium mb-1">Age Range</label>
                        <select
                            value={ageRange}
                            onChange={(e) => setAgeRange(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                        >
                            <option value="">All Ages</option>
                            <option value="18-25">18-25</option>
                            <option value="26-35">26-35</option>
                            <option value="36-45">36-45</option>
                            <option value="46-55">46-55</option>
                            <option value="56+">56+</option>
                        </select>
                    </div>

                    <div className="w-full md:w-64">
                        <label className="block text-sm font-medium mb-1">Gender</label>
                        <select
                            value={selectedSex}
                            onChange={(e) => setSelectedSex(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                        >
                            <option value="">All</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={handleFilterChange}
                            className="border border-zinc-700 bg-zinc-800 text-white px-4 py-2 rounded flex items-center"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Event Summary */}
            {!loading && (
                <div className="bg-zinc-900 p-4 rounded-lg mb-6">
                    <h2 className="text-lg font-semibold mb-3">
                        {selectedEvent ? (events.find(e => e._id === selectedEvent)?.title || 'Event') : 'Global'} Summary
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="bg-zinc-800 p-3 rounded-lg text-center">
                            <div className="text-xl sm:text-2xl font-bold">{summary.total}</div>
                            <div className="text-xs sm:text-sm text-zinc-400">Total Registrations</div>
                        </div>
                        <div className="bg-green-900/30 p-3 rounded-lg text-center">
                            <div className="text-xl sm:text-2xl font-bold text-green-300">{summary.approved}</div>
                            <div className="text-xs sm:text-sm text-green-400">Approved</div>
                        </div>
                        <div className="bg-red-900/30 p-3 rounded-lg text-center">
                            <div className="text-xl sm:text-2xl font-bold text-red-300">{summary.rejected}</div>
                            <div className="text-xs sm:text-sm text-red-400">Rejected</div>
                        </div>
                        <div className="bg-yellow-900/30 p-3 rounded-lg text-center">
                            <div className="text-xl sm:text-2xl font-bold text-yellow-300">{summary.pending}</div>
                            <div className="text-xs sm:text-sm text-yellow-400">Pending</div>
                        </div>
                        <div className="bg-blue-900/30 p-3 rounded-lg text-center">
                            <div className="text-xl sm:text-2xl font-bold text-blue-300">{summary.checkedIn}</div>
                            <div className="text-xs sm:text-sm text-blue-400">Checked In</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading state */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
                    <p>Loading registrations...</p>
                </div>
            ) : (
                <>
                    {/* Registrations table */}
                    {eventRegistrations && eventRegistrations.length > 0 ? (
                        <div className="bg-zinc-900 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-zinc-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left">User</th>
                                            <th className="px-4 py-3 text-left">Event</th>
                                            <th className="px-4 py-3 text-left">Registered On</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Check-In</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {eventRegistrations.map((registration) => (
                                            <tr key={registration._id} className="hover:bg-zinc-800/50">
                                                <td className="px-4 py-3">
                                                    {registration.user ? (
                                                        <div>
                                                            <div className="font-medium">{registration.user.name}</div>
                                                            <div className="text-sm text-zinc-400">{registration.user.email}</div>
                                                            <div className="text-sm text-zinc-400">{registration.user.phone}</div>
                                                            <div className="text-sm text-zinc-400 mt-1">
                                                                {registration.user.age && <span>Age: {registration.user.age}</span>}
                                                                {registration.user.age && registration.user.sex && <span> | </span>}
                                                                {registration.user.sex && <span>Sex: {registration.user.sex}</span>}
                                                                {(registration.user.age || registration.user.sex) && registration.user.instagram && <span> | </span>}
                                                                {registration.user.instagram && (
                                                                    <a
                                                                        href={`https://instagram.com/${registration.user.instagram.replace('@', '')}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-400 hover:underline"
                                                                    >
                                                                        {registration.user.instagram}
                                                                    </a>
                                                                )}
                                                            </div>
                                                            {registration.additionalInfo && (
                                                                <div className="text-sm text-green-400 mt-1 font-medium">
                                                                    Additional Info: {registration.additionalInfo}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-500">User not found</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {registration.event ? (
                                                        <div>
                                                            <div className="font-medium">{registration.event.title}</div>
                                                            <div className="text-sm text-zinc-400">
                                                                {new Date(registration.event.date).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-500">Event not found</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {formatDate(registration.createdAt)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {registration.approved === true ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-300">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Approved
                                                        </span>
                                                    ) : registration.approved === false ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-300">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Rejected
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-300">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {registration.checkedIn ? (
                                                        <div>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Checked In
                                                            </span>
                                                            {registration.checkedInAt && (
                                                                <div className="text-xs text-zinc-400 mt-1">
                                                                    {new Date(registration.checkedInAt).toLocaleString()}
                                                                </div>
                                                            )}
                                                            <Button
                                                                onClick={() => handleRevokeCheckIn(registration._id)}
                                                                className="mt-2 bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-3 py-1 rounded text-xs"
                                                            >
                                                                Revoke Check-In
                                                            </Button>
                                                        </div>
                                                    ) : registration.approved === true ? (
                                                        <Button
                                                            onClick={() => handleCheckIn(registration._id)}
                                                            className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                                        >
                                                            Check In
                                                        </Button>
                                                    ) : (
                                                        <span className="text-zinc-500 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        {registration.approved !== true && (
                                                            <Button
                                                                onClick={() => handleApproval(registration._id, true)}
                                                                className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                                            >
                                                                Approve
                                                            </Button>
                                                        )}
                                                        {registration.approved !== false && (
                                                            <Button
                                                                onClick={() => handleApproval(registration._id, false)}
                                                                className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                                            >
                                                                Reject
                                                            </Button>
                                                        )}
                                                        {registration.approved !== null && (
                                                            <Button
                                                                onClick={() => handleApproval(registration._id, null)}
                                                                className="bg-yellow-800 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                                                            >
                                                                Mark as Pending
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-zinc-900 p-8 rounded-lg text-center">
                            <p className="text-zinc-400">No registrations found matching your filters.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex justify-center mt-6">
                            <nav className="flex space-x-2">
                                {/* Previous Button */}
                                {pagination.page > 1 && (
                                    <Button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        className="px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700"
                                    >
                                        Previous
                                    </Button>
                                )}

                                {/* Page numbers with ellipsis for large page counts */}
                                {Array.from({ length: pagination.pages || 0 }, (_, i) => i + 1)
                                    .filter(page => {
                                        // Always show first and last page
                                        if (page === 1 || page === pagination.pages) return true;
                                        // Always show current page and one page before and after
                                        if (Math.abs(page - pagination.page) <= 1) return true;
                                        // Show a few pages at the beginning if we're not too far
                                        if (pagination.page < 5 && page < 5) return true;
                                        // Show a few pages at the end if we're close to the end
                                        if (pagination.page > pagination.pages - 4 && page > pagination.pages - 4) return true;
                                        // Otherwise hide
                                        return false;
                                    })
                                    .map((page, index, filteredPages) => {
                                        // Add ellipsis where needed
                                        const showEllipsisBefore = index > 0 && filteredPages[index - 1] !== page - 1;
                                        const showEllipsisAfter = index < filteredPages.length - 1 && filteredPages[index + 1] !== page + 1;

                                        return (
                                            <div key={page} className="flex items-center space-x-2">
                                                {showEllipsisBefore && (
                                                    <span className="px-2 text-zinc-500">...</span>
                                                )}
                                                <Button
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-1 rounded ${page === pagination.page
                                                        ? 'bg-white text-black'
                                                        : 'bg-zinc-800 hover:bg-zinc-700'
                                                        }`}
                                                >
                                                    {page}
                                                </Button>
                                                {showEllipsisAfter && (
                                                    <span className="px-2 text-zinc-500">...</span>
                                                )}
                                            </div>
                                        );
                                    })}

                                {/* Next Button */}
                                {pagination.page < pagination.pages && (
                                    <Button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        className="px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700"
                                    >
                                        Next
                                    </Button>
                                )}
                            </nav>
                        </div>
                    )}
                </>
            )}
        </div>
    );
} 