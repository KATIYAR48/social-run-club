'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Search, Filter, Download, RefreshCw, Clipboard } from 'lucide-react';
import Button from '@/components/Button';
import { calculateAgeFromDateOfBirth } from '@/lib/utils';

interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    age?: number;
    dateOfBirth?: string;
    gender?: string;
    instagramUsername?: string;
}

interface VolunteerApplication {
    _id: string;
    userId: string;
    availability: string;
    interests: string;
    experience: string;
    motivation: string;
    skills?: string;
    languages?: string;
    additionalInfo?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    user: User | null;
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
}

export default function VolunteersAdminPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [applications, setApplications] = useState<VolunteerApplication[]>([]);
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
    });
    const [copyingEmails, setCopyingEmails] = useState(false);
    const [emailsCopied, setEmailsCopied] = useState(false);
    const [downloadingCSV, setDownloadingCSV] = useState(false);
    const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [ageRange, setAgeRange] = useState(searchParams.get('ageRange') || '');
    const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || '');

    // Load volunteer applications
    const loadApplications = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());

            if (statusFilter) {
                params.append('status', statusFilter);
            }

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            if (ageRange) {
                params.append('ageRange', ageRange);
            }

            if (selectedGender) {
                params.append('gender', selectedGender);
            }

            // Fetch volunteer applications
            const response = await fetch(`/api/admin/volunteers?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setApplications(data.applications || []);
                setPagination(data.pagination || { total: 0, page: 1, limit: 50, pages: 0 });
                setSummary(data.stats || {
                    total: data.pagination?.total || 0,
                    approved: data.applications?.filter((app: VolunteerApplication) => app.status === 'approved').length || 0,
                    rejected: data.applications?.filter((app: VolunteerApplication) => app.status === 'rejected').length || 0,
                    pending: data.applications?.filter((app: VolunteerApplication) => app.status === 'pending').length || 0,
                });
            } else {
                setError(data.message || 'Failed to load volunteer applications');
            }
        } catch (error) {
            console.error('Error loading volunteer applications:', error);
            setError('An error occurred while loading volunteer applications');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, statusFilter, searchTerm, ageRange, selectedGender]);

    // Handle approval/rejection
    const handleStatusUpdate = async (applicationId: string, status: 'approved' | 'rejected') => {
        setUpdatingApplicationId(applicationId);
        try {
            const response = await fetch('/api/admin/volunteers/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    applicationId,
                    status,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Update the application in the state
                setApplications(prevApplications =>
                    prevApplications.map(app =>
                        app._id === applicationId ? { ...app, status } : app
                    )
                );

                // Update summary counts
                setSummary(prev => {
                    const newSummary = { ...prev };
                    const application = applications.find(app => app._id === applicationId);

                    if (application) {
                        // Decrement previous status count
                        if (application.status === 'approved') newSummary.approved--;
                        else if (application.status === 'rejected') newSummary.rejected--;
                        else if (application.status === 'pending') newSummary.pending--;

                        // Increment new status count
                        if (status === 'approved') newSummary.approved++;
                        else if (status === 'rejected') newSummary.rejected++;
                    }

                    return newSummary;
                });
            } else {
                setError(data.message || 'Failed to update application status');
            }
        } catch (err) {
            setError('An error occurred while updating application status');
            console.error(err);
        } finally {
            setUpdatingApplicationId(null);
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
        if (statusFilter) params.append('status', statusFilter);
        if (searchTerm) params.append('search', searchTerm);
        if (ageRange) params.append('ageRange', ageRange);
        if (selectedGender) params.append('gender', selectedGender);

        router.push(`/admin/volunteers?${params.toString()}`);
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
            const params = new URLSearchParams();
            params.append('emailsOnly', 'true');

            if (statusFilter) params.append('status', statusFilter);
            if (searchTerm) params.append('search', searchTerm);
            if (ageRange) params.append('ageRange', ageRange);
            if (selectedGender) params.append('gender', selectedGender);

            const response = await fetch(`/api/admin/volunteers?${params.toString()}`);
            const data = await response.json();

            if (response.ok && data.emails) {
                await navigator.clipboard.writeText(data.emails.join('\n'));
                setEmailsCopied(true);
                setTimeout(() => setEmailsCopied(false), 3000);
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

    // Function to download all application data as CSV
    const downloadAsCSV = async () => {
        setDownloadingCSV(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.append('format', 'csv');

            if (statusFilter) params.append('status', statusFilter);
            if (searchTerm) params.append('search', searchTerm);
            if (ageRange) params.append('ageRange', ageRange);
            if (selectedGender) params.append('gender', selectedGender);

            const response = await fetch(`/api/admin/volunteers?${params.toString()}`);
            const data = await response.json();

            if (response.ok && data.applications) {
                const headers = [
                    'Name', 'Email', 'Phone', 'Age', 'Gender', 'Instagram',
                    'Availability', 'Interests', 'Experience', 'Motivation',
                    'Skills', 'Languages', 'Additional Info',
                    'Application Date', 'Status'
                ];

                const rows = data.applications.map((app: VolunteerApplication) => {
                    const user = app.user || {} as User;
                    return [
                        user.name || '',
                        user.email || '',
                        user.phone || '',
                        user.age || (user.dateOfBirth ? calculateAgeFromDateOfBirth(user.dateOfBirth) : '') || '',
                        user.gender || '',
                        user.instagramUsername || '',
                        app.availability || '',
                        app.interests || '',
                        app.experience || '',
                        app.motivation || '',
                        app.skills || '',
                        app.languages || '',
                        app.additionalInfo || '',
                        app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '',
                        app.status
                    ];
                });

                const csvContent = [
                    headers.join(','),
                    ...rows.map((row: (string | number)[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const date = new Date().toISOString().split('T')[0];
                link.download = `volunteer-applications-${date}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                setError(data.message || 'Failed to fetch application data for CSV');
            }
        } catch (error) {
            console.error('Error downloading CSV data:', error);
            setError('An error occurred while preparing application data');
        } finally {
            setDownloadingCSV(false);
        }
    };

    // Load data on initial render and when filters/pagination change
    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    return (
        <div className="w-full py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-center md:text-left mb-4 md:mb-0">Volunteer Applications</h1>
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
                        onClick={() => loadApplications()}
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
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                        >
                            <option value="">All Statuses</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
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
                            value={selectedGender}
                            onChange={(e) => setSelectedGender(e.target.value)}
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

            {/* Summary */}
            {!loading && (
                <div className="bg-zinc-900 p-4 rounded-lg mb-6">
                    <h2 className="text-lg font-semibold mb-3">Applications Summary</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-zinc-800 p-3 rounded-lg text-center">
                            <div className="text-xl sm:text-2xl font-bold">{summary.total}</div>
                            <div className="text-xs sm:text-sm text-zinc-400">Total Applications</div>
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
                    </div>
                </div>
            )}

            {/* Loading state */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
                    <p>Loading applications...</p>
                </div>
            ) : (
                <>
                    {/* Applications table */}
                    {applications && applications.length > 0 ? (
                        <div className="bg-zinc-900 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-zinc-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Volunteer</th>
                                            <th className="px-4 py-3 text-left">Application Details</th>
                                            <th className="px-4 py-3 text-left">Applied On</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {applications.map((application) => (
                                            <tr key={application._id} className="hover:bg-zinc-800/50">
                                                <td className="px-4 py-3">
                                                    {application.user ? (
                                                        <div>
                                                            <div className="font-medium">{application.user.name}</div>
                                                            <div className="text-sm text-zinc-400">{application.user.email}</div>
                                                            <div className="text-sm text-zinc-400">{application.user.phone}</div>
                                                            <div className="text-sm text-zinc-400 mt-1">
                                                                                                {(application.user.age || (application.user.dateOfBirth ? calculateAgeFromDateOfBirth(application.user.dateOfBirth) : null)) && (
                                    <span>Age: {application.user.age || (application.user.dateOfBirth ? calculateAgeFromDateOfBirth(application.user.dateOfBirth) : null)}</span>
                                )}
                                {(application.user.age || (application.user.dateOfBirth ? calculateAgeFromDateOfBirth(application.user.dateOfBirth) : null)) && application.user.gender && <span> | </span>}
                                {application.user.gender && <span>Gender: {application.user.gender}</span>}
                                {((application.user.age || (application.user.dateOfBirth ? calculateAgeFromDateOfBirth(application.user.dateOfBirth) : null)) || application.user.gender) && application.user.instagramUsername && <span> | </span>}
                                                                {application.user.instagramUsername && (
                                                                    <a
                                                                        href={`https://instagram.com/${application.user.instagramUsername.replace('@', '')}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-400 hover:underline"
                                                                    >
                                                                        {application.user.instagramUsername}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-500">User not found</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-2">
                                                        <div>
                                                            <span className="font-medium">Availability:</span>
                                                            <p className="text-sm text-zinc-400">{application.availability}</p>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Interests:</span>
                                                            <p className="text-sm text-zinc-400">{application.interests}</p>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Experience:</span>
                                                            <p className="text-sm text-zinc-400">{application.experience}</p>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Motivation:</span>
                                                            <p className="text-sm text-zinc-400">{application.motivation}</p>
                                                        </div>
                                                        {application.skills && (
                                                            <div>
                                                                <span className="font-medium">Skills:</span>
                                                                <p className="text-sm text-zinc-400">{application.skills}</p>
                                                            </div>
                                                        )}
                                                        {application.languages && (
                                                            <div>
                                                                <span className="font-medium">Languages:</span>
                                                                <p className="text-sm text-zinc-400">{application.languages}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {formatDate(application.createdAt)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {application.status === 'approved' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-300">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Approved
                                                        </span>
                                                    ) : application.status === 'rejected' ? (
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
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        {application.status !== 'approved' && (
                                                            <Button
                                                                onClick={() => handleStatusUpdate(application._id, 'approved')}
                                                                disabled={updatingApplicationId === application._id}
                                                                className={`bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center ${updatingApplicationId === application._id ? 'opacity-50 cursor-not-allowed' : ''
                                                                    }`}
                                                            >
                                                                {updatingApplicationId === application._id ? (
                                                                    <>
                                                                        <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                                                                        Approving...
                                                                    </>
                                                                ) : (
                                                                    'Approve'
                                                                )}
                                                            </Button>
                                                        )}
                                                        {application.status !== 'rejected' && (
                                                            <Button
                                                                onClick={() => handleStatusUpdate(application._id, 'rejected')}
                                                                disabled={updatingApplicationId === application._id}
                                                                className={`bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center ${updatingApplicationId === application._id ? 'opacity-50 cursor-not-allowed' : ''
                                                                    }`}
                                                            >
                                                                {updatingApplicationId === application._id ? (
                                                                    <>
                                                                        <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                                                                        Rejecting...
                                                                    </>
                                                                ) : (
                                                                    'Reject'
                                                                )}
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
                            <p className="text-zinc-400">No applications found matching your filters.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex justify-center mt-6">
                            <nav className="flex space-x-2">
                                {pagination.page > 1 && (
                                    <Button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        className="px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700"
                                    >
                                        Previous
                                    </Button>
                                )}

                                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                                    .filter(page => {
                                        if (page === 1 || page === pagination.pages) return true;
                                        if (Math.abs(page - pagination.page) <= 1) return true;
                                        if (pagination.page < 5 && page < 5) return true;
                                        if (pagination.page > pagination.pages - 4 && page > pagination.pages - 4) return true;
                                        return false;
                                    })
                                    .map((page, index, filteredPages) => {
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