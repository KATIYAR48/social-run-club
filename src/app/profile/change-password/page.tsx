'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PasswordInput from '@/components/PasswordInput';
import Loader from "@/components/ui/PixelLoader"

export default function ChangePasswordPage() {
    const { user, isLoading, isAuthenticated, updateProfile } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if not authenticated (this is a backup to middleware)
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth');
        }
    }, [isLoading, isAuthenticated, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate current password
        if (!formData.currentPassword) {
            setError('Current password is required');
            return;
        }

        // Validate new password
        if (!formData.newPassword) {
            setError('New password is required');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        if (formData.newPassword !== formData.confirmNewPassword) {
            setError('New passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            // We only need to update the password, so we'll keep other fields as they are
            const updateData = {
                name: user?.name || '',
                phone: user?.phone || '',
                newPassword: formData.newPassword,
            };

            const result = await updateProfile(updateData, formData.currentPassword);

            if (result.success) {
                setSuccess('Password changed successfully');
                // Reset form
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: '',
                });
            } else {
                setError(result.message);
            }
        } catch (err: unknown) {
            console.error('Password change error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <Loader />
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-black text-white py-12 px-4">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">Change Password</h1>
                        <button
                            onClick={() => router.push('/profile')}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                        >
                            Back to Profile
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-500 text-white p-4 rounded-md mb-6">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-900/50 border border-green-500 text-white p-4 rounded-md mb-6">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="currentPassword" className="block mb-2 font-medium">
                                    Current Password <span className="text-red-500">*</span>
                                </label>
                                <PasswordInput
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                    showHelperText={false}
                                />
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="block mb-2 font-medium">
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <PasswordInput
                                    id="newPassword"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmNewPassword" className="block mb-2 font-medium">
                                    Confirm New Password <span className="text-red-500">*</span>
                                </label>
                                <PasswordInput
                                    id="confirmNewPassword"
                                    name="confirmNewPassword"
                                    value={formData.confirmNewPassword}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                    showHelperText={false}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
} 