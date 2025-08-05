'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PasswordInput from '@/components/PasswordInput';
import Button from '@/components/Button';

export default function EditProfilePage() {
    const { user, isLoading, isAuthenticated, updateProfile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isSettingUpUsername = searchParams.get('setupUsername') === 'true';
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        phone: '',
        age: '',
        gender: '',
        emergencyContact: '',
        instagramUsername: '',
        joinCrew: false,
        currentPassword: '',
        newPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<{
        checking: boolean;
        available: boolean | null;
        message: string;
    }>({ checking: false, available: null, message: '' });

    // Redirect if not authenticated (this is a backup to middleware)
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth');
        }
    }, [isLoading, isAuthenticated, router]);

    // Function to generate username from email
    const generateUsernameFromEmail = (email: string) => {
        const emailPrefix = email.split('@')[0];
        let username = emailPrefix
            .toLowerCase()
            .replace(/\./g, '_')
            .replace(/[^a-z0-9_-]/g, '')
            .trim();

        if (username.length < 3) {
            username = username + '_user';
        }

        if (username.length > 30) {
            username = username.substring(0, 30);
        }

        return username;
    };

    // Populate form with user data when available
    useEffect(() => {
        if (user) {
            const defaultUsername = !user.username && user.email
                ? generateUsernameFromEmail(user.email)
                : user.username || '';

            setFormData({
                name: user.name || '',
                username: defaultUsername,
                phone: user.phone || '',
                age: user.age ? String(user.age) : '',
                gender: user.gender || '',
                emergencyContact: user.emergencyContact || '',
                instagramUsername: user.instagramUsername || '',
                joinCrew: user.joinCrew || false,
                currentPassword: '',
                newPassword: '',
            });
        }
    }, [user]);

    // Function to check username availability
    const checkUsernameAvailability = useCallback(async (username: string) => {
        if (!username || username.length < 3) {
            setUsernameStatus({ checking: false, available: null, message: '' });
            return;
        }

        // Don't check if it's the same as current username
        if (user && username.toLowerCase() === user.username?.toLowerCase()) {
            setUsernameStatus({ checking: false, available: true, message: 'Current username' });
            return;
        }

        // Validate username format
        const usernameRegex = /^[a-z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            setUsernameStatus({
                checking: false,
                available: false,
                message: 'Username can only contain letters, numbers, underscores, and dashes'
            });
            return;
        }

        setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });

        try {
            const response = await fetch('/api/profile/check-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, excludeUserId: user?._id }),
            });

            const data = await response.json();

            if (data.success) {
                setUsernameStatus({
                    checking: false,
                    available: data.available,
                    message: data.message
                });
            } else {
                setUsernameStatus({
                    checking: false,
                    available: false,
                    message: data.message || 'Error checking username'
                });
            }
        } catch (error) {
            console.error('Username check error:', error);
            setUsernameStatus({
                checking: false,
                available: false,
                message: 'Error checking username availability'
            });
        }
    }, [user]);

    // Debounced username availability check
    useEffect(() => {
        if (!formData.username || formData.username === user?.username) {
            setUsernameStatus({ checking: false, available: null, message: '' });
            return;
        }

        const timer = setTimeout(() => {
            checkUsernameAvailability(formData.username);
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.username, user?.username, checkUsernameAvailability]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        // Special handling for username
        if (name === 'username' && typeof newValue === 'string') {
            // Convert to lowercase and remove invalid characters
            newValue = newValue.toLowerCase().replace(/[^a-z0-9_-]/g, '');
            // Limit to 30 characters
            if (newValue.length > 30) {
                newValue = newValue.substring(0, 30);
            }
        }

        setFormData({ ...formData, [name]: newValue });
    };

    // Reset new password when user toggles the change password checkbox
    useEffect(() => {
        if (!changePassword) {
            setFormData(prev => ({ ...prev, newPassword: '' }));
        }
    }, [changePassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate current password
        if (!formData.currentPassword) {
            setError('Current password is required');
            return;
        }

        // Validate username
        if (!formData.username) {
            setError('Username is required');
            return;
        }

        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters long');
            return;
        }

        if (usernameStatus.available === false) {
            setError('Please choose an available username');
            return;
        }

        if (usernameStatus.checking) {
            setError('Please wait for username availability check to complete');
            return;
        }

        // Validate new password if changing password
        if (changePassword) {
            if (!formData.newPassword) {
                setError('New password is required');
                return;
            }

            if (formData.newPassword.length < 6) {
                setError('New password must be at least 6 characters');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const updateData = {
                name: formData.name,
                username: formData.username,
                phone: formData.phone,
                age: formData.age ? parseInt(formData.age) : undefined,
                gender: formData.gender as 'male' | 'female' | 'other' | undefined,
                emergencyContact: formData.emergencyContact,
                instagramUsername: formData.instagramUsername,
                joinCrew: formData.joinCrew,
                newPassword: changePassword ? formData.newPassword : undefined,
            };

            const result = await updateProfile(updateData, formData.currentPassword);

            if (result.success) {
                setSuccess(result.message);
                // Reset password fields
                setFormData({
                    ...formData,
                    currentPassword: '',
                    newPassword: '',
                });
                setChangePassword(false);

                // If this was username setup, redirect to their new public profile
                if (isSettingUpUsername && formData.username) {
                    setTimeout(() => {
                        router.push(`/profile/${formData.username}`);
                    }, 1500); // Give time to see success message
                }
            } else {
                setError(result.message);
            }
        } catch (err: unknown) {
            console.error('Profile update error:', err);
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
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                        <p className="mt-4">Loading...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="min-h-screen bg-black text-white py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">
                            {isSettingUpUsername ? 'Complete Your Profile' : 'Edit Profile'}
                        </h1>
                        {!isSettingUpUsername && (
                            <Button
                                variant="primary"
                                onClick={() => router.push('/profile')}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
                            >
                                Back to Profile
                            </Button>
                        )}
                    </div>

                    {/* Username Setup Message */}
                    {isSettingUpUsername && (
                        <div className="bg-blue-900/50 border border-blue-500 text-blue-100 p-4 rounded-md mb-6">
                            <h2 className="font-semibold mb-2">🎉 Welcome to Public Profiles!</h2>
                            <p className="text-sm">
                                We&apos;ve added shareable public profiles to Cloka! To get started, please choose a username.
                                We&apos;ve suggested one based on your email, but feel free to customize it.
                            </p>
                        </div>
                    )}

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="name" className="block mb-2 font-medium">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="username" className="block mb-2 font-medium">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white pr-10"
                                    />
                                    {usernameStatus.checking && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                        </div>
                                    )}
                                    {usernameStatus.available !== null && (
                                        <div className={`absolute inset-y-0 right-0 pr-3 flex items-center ${usernameStatus.available ? 'text-green-500' : 'text-red-500'}`}>
                                            {usernameStatus.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="phone" className="block mb-2 font-medium">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="username" className="block mb-2 font-medium">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className={`w-full p-3 bg-zinc-800 border rounded-md focus:outline-none focus:ring-2 ${usernameStatus.available === false
                                        ? 'border-red-500 focus:ring-red-500'
                                        : usernameStatus.available === true
                                            ? 'border-green-500 focus:ring-green-500'
                                            : 'border-zinc-700 focus:ring-white'
                                        }`}
                                    minLength={3}
                                    maxLength={30}
                                />
                                {usernameStatus.message && (
                                    <div className={`mt-1 text-sm flex items-center gap-1 ${usernameStatus.checking
                                        ? 'text-zinc-400'
                                        : usernameStatus.available === false
                                            ? 'text-red-400'
                                            : usernameStatus.available === true
                                                ? 'text-green-400'
                                                : 'text-zinc-400'
                                        }`}>
                                        {usernameStatus.checking && (
                                            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                                        )}
                                        {usernameStatus.message}
                                    </div>
                                )}
                                <div className="mt-1 text-xs text-zinc-500">
                                    3-30 characters, letters, numbers, underscores, and dashes only
                                </div>
                            </div>

                            <div>
                                <label htmlFor="age" className="block mb-2 font-medium">
                                    Age
                                </label>
                                <input
                                    type="number"
                                    id="age"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="gender" className="block mb-2 font-medium">
                                    Gender
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="emergencyContact" className="block mb-2 font-medium">
                                    Emergency Contact
                                </label>
                                <input
                                    type="text"
                                    id="emergencyContact"
                                    name="emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                />
                            </div>

                            <div>
                                <label htmlFor="instagramUsername" className="block mb-2 font-medium">
                                    Instagram Username
                                </label>
                                <input
                                    type="text"
                                    id="instagramUsername"
                                    name="instagramUsername"
                                    value={formData.instagramUsername}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="joinCrew"
                                    name="joinCrew"
                                    checked={formData.joinCrew}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                <label htmlFor="joinCrew" className="font-medium">
                                    I want to join the Cloka Crew
                                </label>
                            </div>
                        </div>

                        <div className="border-t border-zinc-800 pt-6 mb-6">
                            <h2 className="text-xl font-bold mb-4">Password</h2>

                            <div className="mb-4">
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
                                <p className="text-sm text-zinc-400 mt-1">
                                    Required to save changes
                                </p>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="changePassword"
                                        checked={changePassword}
                                        onChange={(e) => setChangePassword(e.target.checked)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="changePassword" className="font-medium">
                                        Change Password
                                    </label>
                                </div>
                            </div>

                            {changePassword && (
                                <div className="mb-4">
                                    <label htmlFor="newPassword" className="block mb-2 font-medium">
                                        New Password <span className="text-red-500">*</span>
                                    </label>
                                    <PasswordInput
                                        id="newPassword"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                                        minLength={6}
                                        required={changePassword}
                                        error={changePassword && formData.newPassword.length > 0 && formData.newPassword.length < 6}
                                        errorMessage={formData.newPassword.length > 0 && formData.newPassword.length < 6 ? "Password must be at least 6 characters" : ""}
                                        showHelperText={true}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                variant="secondary"
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
} 