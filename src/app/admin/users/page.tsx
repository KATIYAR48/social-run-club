'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrashIcon, KeyIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Button from "@/components/Button"
import Loader from "@/components/ui/PixelLoader"
import { useAdmin } from '@/lib/admin-context';
import { useRouter } from 'next/navigation';

interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: 'user' | 'admin';
    gender?: 'male' | 'female' | 'other' | null;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

interface GenderStats {
    male: number;
    female: number;
    other: number;
    unknown: number;
    total: number;
}

export default function UsersPage() {
    const { isSuperAdmin } = useAdmin();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState<string>('all');
    const [genderStats, setGenderStats] = useState<GenderStats>({
        male: 0,
        female: 0,
        other: 0,
        unknown: 0,
        total: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
    });
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isResettingPassword, setIsResettingPassword] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [superadminPassword, setSuperadminPassword] = useState('');
    const [isPromoting, setIsPromoting] = useState<string | null>(null);

    useEffect(() => {
        if (!isSuperAdmin) {
            router.replace('/admin');
        }
    }, [isSuperAdmin, router]);

    // Fetch total gender stats
    const fetchTotalGenderStats = useCallback(async () => {
        try {
            setLoadingStats(true);

            // Try to fetch from the stats endpoint
            try {
                const response = await fetch('/api/admin/users/stats');

                if (response.ok) {
                    const data = await response.json();

                    if (data.success && data.stats && data.stats.gender) {
                        setGenderStats(data.stats.gender);
                        setLoadingStats(false);
                        return; // Successfully got stats, exit the function
                    }
                }
                // If we get here, the stats endpoint failed in some way
            } catch {
                // Continue to fallback method
            }

            // Fallback: Fetch all users (without pagination) to calculate stats
            const allUsersResponse = await fetch('/api/admin/users?limit=1000&page=1');

            if (!allUsersResponse.ok) {
                throw new Error('Failed to fetch users for statistics');
            }

            const allUsersData = await allUsersResponse.json();

            if (allUsersData.success) {
                // Get the total count from pagination data if available
                const totalUsers = allUsersData.pagination?.total || allUsersData.users.length;

                // Calculate stats from all users
                const stats = {
                    male: 0,
                    female: 0,
                    other: 0,
                    unknown: 0,
                    total: totalUsers
                };

                allUsersData.users.forEach((user: User) => {
                    if (user.gender === 'male') stats.male++;
                    else if (user.gender === 'female') stats.female++;
                    else if (user.gender === 'other') stats.other++;
                    else stats.unknown++;
                });

                setGenderStats(stats);
            } else {
                throw new Error('Failed to calculate user statistics');
            }
        } catch {
            // Use pagination total as a last resort
            if (pagination.total > 0) {
                setGenderStats(prev => ({
                    ...prev,
                    total: pagination.total
                }));
            }
        } finally {
            setLoadingStats(false);
        }
    }, [pagination.total]);

    // Fetch users
    const fetchUsers = useCallback(async (page = 1, searchTerm = '', gender = 'all') => {
        try {
            setLoading(true);
            setError(null);

            // Build the query parameters
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                search: searchTerm
            });

            // Handle gender filter
            const genderParam = getGenderQueryParam(gender);
            if (genderParam !== null) {
                queryParams.append('gender', genderParam);
            }

            const url = `/api/admin/users?${queryParams.toString()}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();

            if (data.success) {
                setUsers(data.users);
                setPagination(data.pagination);

                // Update total count if we have it from pagination but not from stats
                if (genderStats.total === 0 && data.pagination?.total) {
                    setGenderStats(prev => ({
                        ...prev,
                        total: data.pagination.total
                    }));
                }
            } else {
                throw new Error(data.message || 'Failed to fetch users');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, genderStats.total]);

    // Get the gender query parameter for the API
    const getGenderQueryParam = useCallback((gender: string): string | null => {
        if (gender === 'all') return null;
        if (gender === 'unknown') return 'null'; // Backend expects "null" string for unknown gender
        return gender;
    }, []);

    // Initial fetch
    useEffect(() => {
        if (!isSuperAdmin) return;
        // Fetch total stats first, then users
        fetchTotalGenderStats().then(() => {
            fetchUsers(pagination.page, search, genderFilter);
        });
    }, [isSuperAdmin, fetchTotalGenderStats, fetchUsers, pagination.page, search, genderFilter]);

    // Handle search with debounce
    useEffect(() => {
        if (!isSuperAdmin) return;
        const debounceTimer = setTimeout(() => {
            fetchUsers(1, search, genderFilter);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [search, isSuperAdmin, fetchUsers, genderFilter]);

    if (!isSuperAdmin) {
        return (
            <div className="text-center text-white mt-20">
                You do not have permission to view this page.
            </div>
        );
    }

    // Handle gender filter change
    const handleGenderFilterChange = (gender: string) => {
        setGenderFilter(gender);
        // Reset to page 1 when changing filters, but don't recalculate total stats
        fetchUsers(1, search, gender);
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= pagination.pages) {
            fetchUsers(newPage, search, genderFilter);
        }
    };

    // Handle delete user
    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            setIsDeleting(userId);

            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('User deleted successfully');
                // Refresh the total stats first, then the user list
                fetchTotalGenderStats().then(() => {
                    fetchUsers(pagination.page, search, genderFilter);
                });
            } else {
                throw new Error(data.message || 'Failed to delete user');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsDeleting(null);
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        }
    };

    // Open password reset modal
    const openPasswordResetModal = (userId: string) => {
        setSelectedUserId(userId);
        setNewPassword('');
        setShowPasswordModal(true);
    };

    // Handle password reset
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUserId || !newPassword) {
            return;
        }

        try {
            setIsResettingPassword(selectedUserId);

            const response = await fetch(`/api/admin/users/${selectedUserId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: newPassword }),
            });

            if (!response.ok) {
                throw new Error('Failed to reset password');
            }

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('Password reset successfully');
                setShowPasswordModal(false);
            } else {
                throw new Error(data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsResettingPassword(null);
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        }
    };

    // Handle promote to admin
    const handlePromoteToAdmin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUserId || !superadminPassword) {
            return;
        }

        try {
            setIsPromoting(selectedUserId);

            const response = await fetch('/api/admin/users/promote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUserId,
                    superadminPassword
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMessage('User promoted to admin successfully');
                setShowPromoteModal(false);
                // Update the user in the list
                setUsers(users.map(user =>
                    user._id === selectedUserId
                        ? { ...user, role: 'admin' }
                        : user
                ));
            } else {
                setError(data.message || 'Failed to promote user to admin');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsPromoting(null);
            setSuperadminPassword('');
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        }
    };

    // Open promote modal
    const openPromoteModal = (userId: string) => {
        setSelectedUserId(userId);
        setSuperadminPassword('');
        setShowPromoteModal(true);
    };

    // Generate pagination buttons with limited range
    const renderPaginationButtons = () => {
        const buttons = [];
        const maxVisiblePages = 5; // Maximum number of page buttons to show

        // Calculate range of pages to show
        let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);

        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Previous button
        buttons.push(
            <Button
                key="prev"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                variant="secondary"
                size="small"
            >
                Prev
            </Button>
        );

        // First page and ellipsis if needed
        if (startPage > 1) {
            buttons.push(
                <Button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    variant={pagination.page === 1 ? "primary" : "secondary"}
                    size="small"
                >
                    1
                </Button>
            );

            if (startPage > 2) {
                buttons.push(
                    <span key="ellipsis-start" className="px-2 py-1">
                        ...
                    </span>
                );
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <Button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    variant={pagination.page === i ? "primary" : "secondary"}
                    size="small"
                >
                    {i}
                </Button>
            );
        }

        // Last page and ellipsis if needed
        if (endPage < pagination.pages) {
            if (endPage < pagination.pages - 1) {
                buttons.push(
                    <span key="ellipsis-end" className="px-2 py-1">
                        ...
                    </span>
                );
            }

            buttons.push(
                <Button
                    key={pagination.pages}
                    onClick={() => handlePageChange(pagination.pages)}
                    variant={pagination.page === pagination.pages ? "primary" : "secondary"}
                    size="small"
                >
                    {pagination.pages}
                </Button>
            );
        }

        // Next button
        buttons.push(
            <Button
                key="next"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                variant="secondary"
                size="small"
            >
                Next
            </Button>
        );

        return buttons;
    };

    return (
        <div className="mx-auto">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>

            {/* Success message */}
            {successMessage && (
                <div className="bg-green-500 text-white p-4 mb-4 rounded">
                    {successMessage}
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="bg-red-500 text-white p-4 mb-4 rounded">
                    {error}
                </div>
            )}

            {/* Gender Stats */}
            <div className="mb-2">
                <h2 className="text-xl font-semibold">User Demographics <span className="text-sm font-normal text-zinc-400">(total counts across all users)</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-800 p-4 rounded shadow relative">
                    <h3 className="text-lg font-semibold mb-1">Total Users</h3>
                    {loadingStats ? (
                        <div className="flex items-start">
                            <Loader />
                        </div>
                    ) : (
                        <p className="text-2xl font-bold">{genderStats.total}</p>
                    )}
                    <div className="text-xs text-right absolute bottom-1 right-2 text-zinc-400">
                        Total count
                    </div>
                </div>
                <div className="bg-blue-900 p-4 rounded shadow relative">
                    <h3 className="text-lg font-semibold mb-1">Male</h3>
                    {loadingStats ? (
                        <div className="flex items-start">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <p className="text-2xl font-bold">{genderStats.male}</p>
                            <p className="text-sm opacity-75">
                                {genderStats.total > 0
                                    ? `${Math.round((genderStats.male / genderStats.total) * 100)}%`
                                    : '0%'}
                            </p>
                        </>
                    )}
                    <div className="text-xs text-right absolute bottom-1 right-2 text-blue-300">
                        Total count
                    </div>
                </div>
                <div className="bg-pink-900 p-4 rounded shadow relative">
                    <h3 className="text-lg font-semibold mb-1">Female</h3>
                    {loadingStats ? (
                        <div className="flex items-start">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <p className="text-2xl font-bold">{genderStats.female}</p>
                            <p className="text-sm opacity-75">
                                {genderStats.total > 0
                                    ? `${Math.round((genderStats.female / genderStats.total) * 100)}%`
                                    : '0%'}
                            </p>
                        </>
                    )}
                    <div className="text-xs text-right absolute bottom-1 right-2 text-pink-300">
                        Total count
                    </div>
                </div>
                <div className="bg-purple-900 p-4 rounded shadow relative">
                    <h3 className="text-lg font-semibold mb-1">Other</h3>
                    {loadingStats ? (
                        <Loader />
                    ) : (
                        <>
                            <p className="text-2xl font-bold">{genderStats.other}</p>
                            <p className="text-sm opacity-75">
                                {genderStats.total > 0
                                    ? `${Math.round((genderStats.other / genderStats.total) * 100)}%`
                                    : '0%'}
                            </p>
                        </>
                    )}
                    <div className="text-xs text-right absolute bottom-1 right-2 text-purple-300">
                        Total count
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or phone"
                        className="w-full p-2 pl-10 border border-zinc-700 bg-zinc-900 text-white rounded"
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                </div>

                <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-zinc-400" />
                    <select
                        value={genderFilter}
                        onChange={(e) => handleGenderFilterChange(e.target.value)}
                        className="p-2 border border-zinc-700 bg-zinc-900 text-white rounded"
                        aria-label="Filter by gender"
                    >
                        <option value="all">All Genders</option>
                        <option value="male" className="bg-blue-900">Male</option>
                        <option value="female" className="bg-pink-900">Female</option>
                        <option value="other" className="bg-purple-900">Other</option>
                        <option value="unknown" className="bg-gray-700">Unknown</option>
                    </select>
                    {genderFilter !== 'all' && (
                        <button
                            onClick={() => handleGenderFilterChange('all')}
                            className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800"
                            aria-label="Clear gender filter"
                            title="Clear filter"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Filter indicator */}
            {genderFilter !== 'all' && (
                <div className="mb-4 flex items-center">
                    <span className="text-sm bg-zinc-800 px-3 py-1 rounded-full flex items-center">
                        Filtered by: {genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1)}
                        <button
                            onClick={() => handleGenderFilterChange('all')}
                            className="ml-2 text-zinc-400 hover:text-white"
                            aria-label="Clear filter"
                        >
                            ×
                        </button>
                    </span>
                </div>
            )}

            {/* Users table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-zinc-800">
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-left">Email</th>
                            <th className="p-3 text-left">Phone</th>
                            <th className="p-3 text-left">Gender</th>
                            <th className="p-3 text-left">Role</th>
                            <th className="p-3 text-left">Created At</th>
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-3 py-10 text-center">
                                    <Loader />
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-3 text-center">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id} className="border-b border-zinc-700 hover:bg-zinc-900">
                                    <td className="p-3">{user.name}</td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">{user.phone}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${user.gender === 'male' ? 'bg-blue-900' :
                                                user.gender === 'female' ? 'bg-pink-900' :
                                                    user.gender === 'other' ? 'bg-purple-900' : 'bg-gray-700'
                                                }`}
                                        >
                                            {user.gender || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-900' : 'bg-zinc-700'
                                                }`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex space-x-2">
                                            {user.role !== 'admin' && (
                                                <Button
                                                    onClick={() => openPromoteModal(user._id)}
                                                    className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                                    title="Promote to Admin"
                                                    isLoading={isPromoting === user._id}
                                                    size="small"
                                                >
                                                    {isPromoting !== user._id && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582a1 1 0 00-.646.933V9.5h11.2V6.838a1 1 0 00-.646-.933L11 4.323V3a1 1 0 00-1-1zM4.4 11v3.162a1 1 0 00.646.933L9 16.677V18a1 1 0 002 0v-1.323l3.954-1.582a1 1 0 00.646-.933V11H4.4z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </Button>
                                            )}
                                            <Button
                                                onClick={() => openPasswordResetModal(user._id)}
                                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                title="Reset Password"
                                                isLoading={isResettingPassword === user._id}
                                                size="small"
                                            >
                                                {isResettingPassword !== user._id && (
                                                    <KeyIcon className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => handleDeleteUser(user._id)}
                                                className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                                                title="Delete User"
                                                disabled={user.role === 'admin'}
                                                isLoading={isDeleting === user._id}
                                                size="small"
                                                variant="danger"
                                            >
                                                {isDeleting !== user._id && (
                                                    <TrashIcon className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && pagination.pages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                    {renderPaginationButtons()}
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                        <form onSubmit={handleResetPassword}>
                            <div className="mb-4">
                                <label htmlFor="newPassword" className="block mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-2 border border-zinc-700 bg-zinc-900 text-white rounded"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    variant="secondary"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isResettingPassword !== null}
                                    loadingText="Resetting..."
                                >
                                    Reset Password
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Promote to Admin Modal */}
            {showPromoteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Promote User to Admin</h2>
                        <form onSubmit={handlePromoteToAdmin}>
                            <div className="mb-4">
                                <label htmlFor="superadminPassword" className="block mb-2">
                                    Superadmin Password
                                </label>
                                <input
                                    type="password"
                                    id="superadminPassword"
                                    value={superadminPassword}
                                    onChange={(e) => setSuperadminPassword(e.target.value)}
                                    className="w-full p-2 border border-zinc-700 bg-zinc-900 text-white rounded"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    onClick={() => setShowPromoteModal(false)}
                                    variant="secondary"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isPromoting !== null}
                                    loadingText="Promoting..."
                                >
                                    Promote to Admin
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 