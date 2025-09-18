'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { cn } from '@/lib/utils';
import Button from '@/components/Button';
import Loader from '@/components/ui/PixelLoader';

interface NotificationHistory {
    _id: string;
    title: string;
    message: string;
    url?: string;
    sentBy: {
        name: string;
        email: string;
    };
    sentTo: string | string[];
    totalSent: number;
    successCount: number;
    failureCount: number;
    status: 'sending' | 'completed' | 'failed';
    createdAt: string;
}

interface SendNotificationResponse {
    success: boolean;
    message: string;
    details?: {
        totalSent: number;
        successCount: number;
        failureCount: number;
        targetUsers: number;
        activeSubscriptions: number;
    };
    notificationId?: string;
}

export default function AdminNotificationsPage() {
    const { isAdmin, isLoading } = useAdmin();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [history, setHistory] = useState<NotificationHistory[]>([]);
    const [stats, setStats] = useState<{ subscribers: number; crewMembers: number; nonCrewMembers: number } | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        url: '',
        targetAudience: 'all' as 'all' | 'crew' | 'non-crew'
    });

    // Fetch notification history and stats
    useEffect(() => {
        if (isAdmin) {
            fetchHistory();
            fetchStats();
        }
    }, [isAdmin]);

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/notifications/send?limit=10');
            const data = await response.json();

            if (data.success) {
                setHistory(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notification history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const fetchStats = async () => {
        try {
            // Get subscriber count
            const subResponse = await fetch('/api/notifications/stats');
            if (subResponse.ok) {
                const subData = await subResponse.json();
                setStats(subData.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.message.trim()) {
            setMessage({ type: 'error', text: 'Title and message are required' });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    message: formData.message.trim(),
                    url: formData.url.trim() || undefined,
                    targetAudience: formData.targetAudience
                }),
            });

            const data: SendNotificationResponse = await response.json();

            if (data.success) {
                setMessage({
                    type: 'success',
                    text: `Notification sent successfully! ${data.details?.successCount}/${data.details?.totalSent} delivered successfully.`
                });
                setFormData({ title: '', message: '', url: '', targetAudience: 'all' });
                fetchHistory(); // Refresh history
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to send notification' });
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            setMessage({ type: 'error', text: 'An error occurred while sending the notification' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <Loader />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <p>Access denied. Admin privileges required.</p>
            </div>
        );
    }

    const getAudienceDisplayName = (audience: string | string[]) => {
        if (Array.isArray(audience)) return `${audience.length} specific users`;
        switch (audience) {
            case 'all': return 'All users';
            case 'crew': return 'Crew members only';
            case 'non-crew': return 'Non-crew members only';
            default: return audience;
        }
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case 'completed':
                return `${baseClasses} bg-green-900 text-green-300`;
            case 'failed':
                return `${baseClasses} bg-red-900 text-red-300`;
            case 'sending':
                return `${baseClasses} bg-yellow-900 text-yellow-300`;
            default:
                return `${baseClasses} bg-gray-900 text-gray-300`;
        }
    };

    return (
        <div className="bg-black text-white">
            <div className="">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Push Notifications</h1>
                    <p className="text-gray-400">Send push notifications to your app users</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-zinc-900  p-4 border border-zinc-700">
                            <h3 className="text-sm font-medium text-gray-400 mb-1">Total Subscribers</h3>
                            <p className="text-2xl font-bold">{stats.subscribers}</p>
                        </div>
                        <div className="bg-zinc-900  p-4 border border-zinc-700">
                            <h3 className="text-sm font-medium text-gray-400 mb-1">Crew Members</h3>
                            <p className="text-2xl font-bold">{stats.crewMembers}</p>
                        </div>
                        <div className="bg-zinc-900  p-4 border border-zinc-700">
                            <h3 className="text-sm font-medium text-gray-400 mb-1">Non-Crew Members</h3>
                            <p className="text-2xl font-bold">{stats.nonCrewMembers}</p>
                        </div>
                    </div>
                )}

                {/* Send Notification Form */}
                <div className="bg-zinc-900  p-6 border border-zinc-700 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Send New Notification</h2>

                    {message && (
                        <div className={cn(
                            "p-4  mb-4",
                            message.type === 'success' ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                        )}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter notification title"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium mb-2">
                                Message *
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter notification message"
                                rows={3}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                maxLength={300}
                            />
                        </div>

                        <div>
                            <label htmlFor="url" className="block text-sm font-medium mb-2">
                                URL (optional)
                            </label>
                            <input
                                type="url"
                                id="url"
                                name="url"
                                value={formData.url}
                                onChange={handleInputChange}
                                placeholder="https://example.com (optional)"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="targetAudience" className="block text-sm font-medium mb-2">
                                Target Audience
                            </label>
                            <select
                                id="targetAudience"
                                name="targetAudience"
                                value={formData.targetAudience}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600  text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Users</option>
                                <option value="crew">Crew Members Only</option>
                                <option value="non-crew">Non-Crew Members Only</option>
                            </select>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full border border-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-2 px-4  transition-colors"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <Loader text={"Sending..."} />
                                </span>
                            ) : (
                                'Send Notification'
                            )}
                        </Button>
                    </form>
                </div>

                {/* Notification History */}
                <div className="bg-zinc-900  p-6 border border-zinc-700">
                    <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>

                    {isLoadingHistory ? (
                        <div className="text-center py-8">
                            <Loader text={'Loading history...'} />
                        </div>
                    ) : history.length === 0 ? (
                        <p className="text-gray-400 py-8 text-center">No notifications sent yet</p>
                    ) : (
                        <div className="space-y-4">
                            {history.map((notification) => (
                                <div key={notification._id} className="bg-zinc-800  p-4 border border-zinc-600">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className='text-wrap max-w-sm overflow-scroll'>
                                            <h3 className="font-medium">{notification.title}</h3>
                                            <p className="text-gray-400 text-sm">{notification.message}</p>
                                            {notification.url && (
                                                <p className="text-blue-400 text-sm mt-1 ">{notification.url}</p>
                                            )}
                                        </div>

                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-3">
                                        <span>Target: {getAudienceDisplayName(notification.sentTo)}</span>
                                        <span>Sent: {notification.successCount}/{notification.totalSent}</span>
                                        {notification.failureCount > 0 && (
                                            <span className="text-red-400">Failed: {notification.failureCount}</span>
                                        )}
                                        <span>By: {notification.sentBy.name}</span>
                                        <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                                        <span className={getStatusBadge(notification.status)}>
                                            {notification.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 