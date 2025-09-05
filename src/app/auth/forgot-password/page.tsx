'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                setEmail(''); // Clear email field
            } else {
                setError(data.message);
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-800 p-8 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>

                    {success ? (
                        <div className="text-zinc-300 mb-4">
                            {success}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 border focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-red-400">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col space-y-4">
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    isLoading={isLoading}
                                    loadingText="Sending..."
                                >
                                    Send Reset Link
                                </Button>

                                <Button
                                    type="button"
                                    variant="primary"

                                    onClick={() => router.push('/auth')}
                                >
                                    Back to Login
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}