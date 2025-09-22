'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Search, Filter, Download, RefreshCw, Clipboard, Mail } from 'lucide-react';
import Button from '@/components/Button';
import { calculateAgeFromDateOfBirth } from '@/lib/utils';
import Loader from '@/components/ui/PixelLoader';

interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    age?: number;
    dateOfBirth?: string;
    sex?: string;
    instagram?: string;
}

interface Event {
    _id: string;
    title: string;
    date: string;
    location: string;
    autoApprove?: boolean;
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
    userStats?: {
        totalEvents: number;
        checkedInEvents: number;
    };
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
    const [sendingApprovalEmails, setSendingApprovalEmails] = useState(false);
    const [downloadingCSV, setDownloadingCSV] = useState(false);
    const [checkingInId, setCheckingInId] = useState<string | null>(null);
    const [revokingCheckInId, setRevokingCheckInId] = useState<string | null>(null);
    const [customMessage, setCustomMessage] = useState('');
    const [showCustomMessage, setShowCustomMessage] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [approvalResults, setApprovalResults] = useState<{
        sent: number;
        failed: number;
        total: number;
    } | null>(null);

    // Filters
    const [selectedEvent, setSelectedEvent] = useState(searchParams.get('eventId') || '');
    const [approvalStatus, setApprovalStatus] = useState(searchParams.get('approved') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [ageRange, setAgeRange] = useState(searchParams.get('ageRange') || '');
    const [selectedSex, setSelectedSex] = useState(searchParams.get('sex') || '');

    // Sort
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
    const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

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

            // Add sort parameters
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);

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
    }, [pagination.page, pagination.limit, selectedEvent, approvalStatus, searchTerm, ageRange, selectedSex, sortBy, sortOrder]);

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

                // Clear PWA cache to ensure users see updated approval status
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    navigator.serviceWorker.controller?.postMessage({
                        type: "CLEAR_EVENTS_CACHE"
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
        setCheckingInId(registrationId);
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
        } finally {
            setCheckingInId(null);
        }
    };

    // Handle revoke check-in
    const handleRevokeCheckIn = async (registrationId: string) => {
        setRevokingCheckInId(registrationId);
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
        } finally {
            setRevokingCheckInId(null);
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
        if (sortBy) params.append('sortBy', sortBy);
        if (sortOrder) params.append('sortOrder', sortOrder);

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

            // Add sort parameters
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);

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


    // Function to send automated approval emails
    const sendApprovalEmails = async () => {
        if (!selectedEvent) {
            setError('Please select an event first');
            return;
        }

        setSendingApprovalEmails(true);
        setError('');

        try {
            const response = await fetch('/api/admin/event-registrations/send-approval-emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventId: selectedEvent,
                    customMessage: customMessage || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Show results in modal
                setApprovalResults(data.results);
                setShowResultsModal(true);

                // Reset custom message
                setCustomMessage('');
                setShowCustomMessage(false);
            } else {
                setError(data.message || 'Failed to send approval emails');
            }
        } catch (error) {
            console.error('Error sending approval emails:', error);
            setError('An error occurred while sending approval emails');
        } finally {
            setSendingApprovalEmails(false);
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

            // Add sort parameters
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);

            // Fetch all registrations matching the current filters
            const response = await fetch(`/api/admin/event-registrations?${params.toString()}`);
            const data = await response.json();

            if (response.ok && data.registrations) {
                // Convert registrations to CSV
                const registrations = data.registrations;

                // Define CSV headers
                const headers = [
                    'Name', 'Email', 'Phone', 'Age', 'Gender', 'Instagram',
                    'Event', 'Event Date', 'Registration Date', 'Status', 'Checked In',
                    'Total Events Registered', 'Events Checked In', 'Check-In Ratio', 'Additional Info'
                ];

                // Map registrations to CSV rows
                const rows = registrations.map((reg: EventRegistration) => {
                    const user = reg.user || {} as User;
                    const event = reg.event || {} as Event;
                    const status = reg.approved === true ? 'Approved' :
                        reg.approved === false ? 'Rejected' : 'Pending';
                    const checkInRatio = reg.userStats && reg.userStats.totalEvents > 0
                        ? `${Math.round((reg.userStats.checkedInEvents / reg.userStats.totalEvents) * 100)}%`
                        : '0%';

                    return [
                        user.name || '',
                        user.email || '',
                        user.phone || '',
                        user.age || (user.dateOfBirth ? calculateAgeFromDateOfBirth(user.dateOfBirth) : '') || '',
                        user.sex || '',
                        user.instagram || '',
                        event.title || '',
                        event.date ? new Date(event.date).toLocaleDateString() : '',
                        reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '',
                        status,
                        reg.checkedIn ? 'Yes' : 'No',
                        reg.userStats?.totalEvents || 0,
                        reg.userStats?.checkedInEvents || 0,
                        checkInRatio,
                        reg.additionalInfo || ''
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
        <div className="mb-5">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                <h1 className="text-xl md:text-3xl font-bold text-start md:text-left mb-4 md:mb-0">Registrations</h1>
                <div className="flex space-x-2">
                    <Button
                        onClick={copyEmailsToClipboard}
                        disabled={copyingEmails}
                        className={`flex text-sm items-center ${emailsCopied ? 'bg-green-600' : 'bg-zinc-800 hover:bg-zinc-700'} text-white px-4 py-2 rounded`}
                    >
                        {copyingEmails ? (
                            <>
                                <Loader text={'Copying...'} />
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
                        onClick={() => setShowCustomMessage(!showCustomMessage)}
                        disabled={!selectedEvent || sendingApprovalEmails}
                        className="flex text-sm items-center bg-zinc-700 hover:bg-green-700 !text-white px-4 py-2 rounded"
                    >
                        {sendingApprovalEmails ? (
                            <Loader text={"Sending..."} />
                        ) : (
                            <div className='flex items-center'>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Approval mails
                            </div>
                        )}
                    </Button>
                    <Button
                        onClick={downloadAsCSV}
                        disabled={downloadingCSV}
                        className="flex text-sm items-center bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded"
                    >
                        {downloadingCSV ? (
                            <Loader text="Downloading.." />
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                CSV
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={() => loadEventRegistrations()}
                        className="flex text-sm items-center bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded"
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
                                    {event.title} {event.autoApprove ? '(Auto-Approved)' : ''}
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

                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium mb-1">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                        >
                            <option value="createdAt">Registration Date</option>
                            <option value="checkInScore">Check-In Score</option>
                            <option value="userName">Name</option>
                        </select>
                    </div>

                    <div className="w-full md:w-32">
                        <label className="block text-sm font-medium mb-1">Order</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
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

            {/* Custom Message Input */}
            {showCustomMessage && (
                <div className="bg-zinc-900 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-3">Custom Approval Message</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Custom Message (Optional)
                        </label>
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Enter a custom message for the approval emails. If left empty, the event's post-approval message will be used, or a default message will be sent."
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 h-24 resize-none"
                            rows={3}
                        />
                        <p className="text-xs text-zinc-400 mt-1">
                            This message will be sent to all approved participants for the selected event.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={sendApprovalEmails}
                            disabled={sendingApprovalEmails}
                            className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded"
                        >
                            {sendingApprovalEmails ? (
                                <Loader text={'Sending emails...'} />
                            ) : (
                                <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Approval Emails
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => {
                                setShowCustomMessage(false);
                                setCustomMessage('');
                            }}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

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

                    {/* Auto-approval info */}
                    {selectedEvent && events.find(e => e._id === selectedEvent)?.autoApprove && (
                        <div className="mt-4 p-3 bg-green-900/20 border border-green-800 text-green-300 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">Auto-Approval Enabled</span>
                            </div>
                            <p className="text-sm mt-1 text-green-200">
                                This event has automatic approval enabled. All new registrations will be automatically approved without requiring manual review.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Loading state */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader text={'Loading registrations...'} />
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
                                            <th className="px-4 py-3 text-center">Check-In Score</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                            <th className="px-4 py-3 text-left">Check-In</th>
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
                                                                {(registration.user.age || (registration.user.dateOfBirth ? calculateAgeFromDateOfBirth(registration.user.dateOfBirth) : null)) && (
                                                                    <span>Age: {registration.user.age || (registration.user.dateOfBirth ? calculateAgeFromDateOfBirth(registration.user.dateOfBirth) : null)}</span>
                                                                )}
                                                                {(registration.user.age || (registration.user.dateOfBirth ? calculateAgeFromDateOfBirth(registration.user.dateOfBirth) : null)) && registration.user.sex && <span> | </span>}
                                                                {registration.user.sex && <span>Sex: {registration.user.sex}</span>}
                                                                {((registration.user.age || (registration.user.dateOfBirth ? calculateAgeFromDateOfBirth(registration.user.dateOfBirth) : null)) || registration.user.sex) && registration.user.instagram && <span> | </span>}
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
                                                            <div className="font-medium flex items-center">
                                                                {registration.event.title}
                                                                {registration.event.autoApprove && (
                                                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300">
                                                                        Auto-Approved
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                <td className="px-4 py-3 text-center">
                                                    {registration.userStats ? (
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-sm font-medium">
                                                                {(() => {
                                                                    const { totalEvents, checkedInEvents } = registration.userStats;
                                                                    if (totalEvents === 0) return '0%';

                                                                    // Base percentage score
                                                                    const basePercentage = (checkedInEvents / totalEvents) * 100;

                                                                    // Volume bonus: +10 points for every 5 events attended
                                                                    const volumeBonus = Math.floor(checkedInEvents / 5) * 10;

                                                                    // Consistency bonus: +5 points for maintaining 50%+ attendance over 10+ events
                                                                    const consistencyBonus = (totalEvents >= 10 && basePercentage >= 50) ? 5 : 0;

                                                                    // Calculate smart score (capped at 100%)
                                                                    const smartScore = Math.min(100, basePercentage + volumeBonus + consistencyBonus);

                                                                    return `${Math.round(smartScore)}%`;
                                                                })()}
                                                            </div>
                                                            <div className="text-xs text-zinc-400">
                                                                {registration.userStats.checkedInEvents}/{registration.userStats.totalEvents}
                                                            </div>
                                                            {registration.userStats.totalEvents > 0 && (
                                                                <div className="text-xs text-zinc-500 mt-1">
                                                                    {(() => {
                                                                        const { totalEvents, checkedInEvents } = registration.userStats;
                                                                        const basePercentage = (checkedInEvents / totalEvents) * 100;
                                                                        const volumeBonus = Math.floor(checkedInEvents / 5) * 10;
                                                                        const consistencyBonus = (totalEvents >= 10 && basePercentage >= 50) ? 5 : 0;

                                                                        if (volumeBonus > 0 || consistencyBonus > 0) {
                                                                            return `(${Math.round(basePercentage)}% + ${volumeBonus + consistencyBonus} bonus)`;
                                                                        }
                                                                        return '';
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-500 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex md:flex-row flex-col justify-end gap-2">
                                                        {registration.approved !== true && registration.checkedIn === false && (
                                                            <Button
                                                                onClick={() => handleApproval(registration._id, true)}
                                                                className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                                            >
                                                                Approve
                                                            </Button>
                                                        )}
                                                        {registration.approved !== null && registration.checkedIn === false && (
                                                            <Button
                                                                onClick={() => handleApproval(registration._id, null)}
                                                                className="bg-zinc-800 hover:bg-zinc-600 text-white px-3 py-1 rounded text-sm"
                                                            >
                                                                Reset
                                                            </Button>
                                                        )}
                                                        {registration.approved !== false && registration.checkedIn === false && (
                                                            <Button
                                                                onClick={() => handleApproval(registration._id, false)}
                                                                className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                                            >
                                                                Reject
                                                            </Button>
                                                        )}

                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {registration.checkedIn ? (
                                                        <div className='flex flex-col items-end justify-between gap-2'>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-blue-900/30 text-blue-300">
                                                                At {new Date(registration.checkedInAt || '').toLocaleString()}
                                                            </span>

                                                            <Button
                                                                onClick={() => handleRevokeCheckIn(registration._id)}
                                                                isLoading={revokingCheckInId === registration._id}
                                                                loadingText="Revoking..."
                                                                className="mt-2 border border-fuchsia-700 hover:bg-fuchsia-600 text-white px-3 py-1 rounded text-xs"
                                                            >
                                                                Revoke
                                                            </Button>
                                                        </div>
                                                    ) : registration.approved === true ? (
                                                        <Button
                                                            onClick={() => handleCheckIn(registration._id)}
                                                            isLoading={checkingInId === registration._id}
                                                            loadingText="Checking In..."
                                                            className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                                        >
                                                            Check In
                                                        </Button>
                                                    ) : (
                                                        <span className="text-zinc-500 text-xs">-</span>
                                                    )}
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

            {/* Results Modal */}
            {showResultsModal && approvalResults && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Approval Emails Sent</h3>
                            <button
                                onClick={() => setShowResultsModal(false)}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                                    <span className="text-green-300 font-medium">Successfully Sent</span>
                                </div>
                                <div className="text-2xl font-bold text-green-200">{approvalResults.sent}</div>
                            </div>

                            {approvalResults.failed > 0 && (
                                <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <XCircle className="h-5 w-5 text-red-400 mr-2" />
                                        <span className="text-red-300 font-medium">Failed</span>
                                    </div>
                                    <div className="text-2xl font-bold text-red-200">{approvalResults.failed}</div>
                                </div>
                            )}

                            <div className="bg-zinc-800 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <Mail className="h-5 w-5 text-zinc-400 mr-2" />
                                    <span className="text-zinc-300 font-medium">Total Processed</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{approvalResults.total}</div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button
                                onClick={() => setShowResultsModal(false)}
                                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 