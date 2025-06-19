'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PasswordInput from '@/components/PasswordInput';
import Button from '@/components/Button';
import Image from 'next/image';

export default function AuthPage() {
    const searchParams = useSearchParams();
    const initialMode = searchParams.get('mode') === 'signup' ? false : true;
    const [isLoginMode, setIsLoginMode] = useState(initialMode);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const redirect = searchParams.get('redirect') || '/';
    const { login, signup, isAuthenticated } = useAuth();

    // Redirect if user is already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.replace(redirect);
        }
    }, [isAuthenticated, router, redirect]);

    // Update mode when URL parameters change
    useEffect(() => {
        setIsLoginMode(searchParams.get('mode') !== 'signup');
    }, [searchParams]);

    // Detect mobile screen size
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkIsMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkIsMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Login state
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
    });

    // Signup state
    const [signupData, setSignupData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        age: '',
        gender: '',
        emergencyContact: '',
        instagramUsername: '',
        joinCrew: false,
        acceptTerms: false,
    });

    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData({ ...loginData, [name]: value });
    };

    const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        // Special handling for phone number - only allow digits and limit to 10 digits
        if (name === 'phone' && typeof newValue === 'string') {
            // Remove all non-digit characters
            const digitsOnly = newValue.replace(/\D/g, '');

            // Take only the last 10 digits if more are entered
            newValue = digitsOnly.slice(-10);
        }

        // Special handling for age - silently cap at 30
        if (name === 'age' && typeof newValue === 'string') {
            const ageValue = parseInt(newValue);
            if (!isNaN(ageValue) && ageValue > 30) {
                newValue = '30';
            }
        }

        setSignupData({ ...signupData, [name]: newValue });
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(loginData.email, loginData.password);

            if (result.success) {
                router.push(redirect);
            } else {
                setError(result.message);
            }
        } catch (err: unknown) {
            setError('An error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate required fields
        if (!signupData.name || !signupData.email || !signupData.password || !signupData.phone || !signupData.age || !signupData.gender || !signupData.instagramUsername) {
            setError('Please fill in all required fields');
            return;
        }

        // Validate phone number (must be exactly 10 digits for Indian numbers)
        if (!/^\d{10}$/.test(signupData.phone)) {
            setError('Please enter a valid 10-digit Indian phone number');
            return;
        }

        // Validate terms acceptance
        if (!signupData.acceptTerms) {
            setError('You must accept the Terms and Conditions to continue');
            return;
        }

        setIsLoading(true);

        try {
            const result = await signup({
                name: signupData.name,
                email: signupData.email,
                password: signupData.password,
                phone: signupData.phone,
                age: signupData.age ? parseInt(signupData.age) : undefined,
                gender: signupData.gender as 'male' | 'female' | 'other' | undefined,
                emergencyContact: signupData.emergencyContact || undefined,
                instagramUsername: signupData.instagramUsername,
                joinCrew: signupData.joinCrew,
            });

            if (result.success) {
                router.push('/profile');
            } else {
                setError(result.message);
            }
        } catch (_err) {
            console.error(_err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        const newMode = !isLoginMode;
        setIsLoginMode(newMode);
        setError('');

        // Update URL to reflect the current mode
        const newUrl = new URL(window.location.href);
        if (!newMode) {
            newUrl.searchParams.set('mode', 'signup');
        } else {
            newUrl.searchParams.delete('mode');
        }

        // Update the URL without refreshing the page
        window.history.pushState({}, '', newUrl.toString());
    };

    return (
        <>
            <Header />
            <div className="bg-black text-white flex items-center justify-center px-4 py-12">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Image Section */}
                        <motion.div
                            initial={{ opacity: 0, x: isLoginMode ? 0 : (isMobile ? 0 : 100) }}
                            animate={{
                                opacity: 1,
                                x: isLoginMode ? 0 : (isMobile ? 0 : 100)
                            }}
                            transition={{
                                duration: 0.5,
                                type: "spring",
                                stiffness: 100
                            }}
                            className={`w-full md:w-1/2 order-1 ${isLoginMode ? 'md:order-1' : 'md:order-2'} relative`}
                        >
                            <div className="h-full overflow-hidden shadow-2xl border border-zinc-800">
                                <Image
                                    width={1000}
                                    height={1000}
                                    src={isLoginMode ? "/images/runcluber.png" : "/images/returning.png"}
                                    alt={isLoginMode ? "Run Club" : "Returning Runners"}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-[90%] bg-black/70 p-4 backdrop-blur-sm">
                                    <h3 className="text-xl font-bold mb-2">
                                        {isLoginMode ? "Welcome Back Runners" : "Join Our Running Community"}
                                    </h3>
                                    <p className="text-zinc-300">
                                        {isLoginMode
                                            ? "Ready to hit the road again? Sign up to track your runs and join upcoming events!"
                                            : "Connect with fellow runners, track your progress, and participate in exciting events!"}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Form Section */}
                        <motion.div
                            initial={{ opacity: 0, x: isLoginMode ? (isMobile ? 0 : -100) : 0 }}
                            animate={{
                                opacity: 1,
                                x: 0
                            }}
                            transition={{
                                duration: 0.5,
                                type: "spring",
                                stiffness: 100
                            }}
                            className={`p-6 md:p-8 shadow-lg w-full md:w-1/2 border border-zinc-700 bg-black order-2 ${isLoginMode ? 'md:order-2' : 'md:order-1'}`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="inline-flex shadow-sm" role="group">
                                    <Button
                                        type="button"
                                        onClick={() => setIsLoginMode(true)}
                                        className={`px-4 py-2 text-sm font-medium ${isLoginMode
                                            ? ' text-black border border-zinc-700'
                                            : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                                            }`}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setIsLoginMode(false)}
                                        className={`px-4 py-2 text-sm font-medium ${!isLoginMode
                                            ? ' text-black border border-zinc-700'
                                            : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700'
                                            }`}
                                    >
                                        Sign Up
                                    </Button>
                                </div>

                                <h1 className="text-2xl font-bold text-end">
                                    {isLoginMode ? 'Welcome back!' : 'Join the club'}
                                </h1>
                            </div>

                            {error && (
                                <div className="p-4  mb-4 bg-red-900/30 border border-red-800 text-red-300">
                                    {error}
                                </div>
                            )}

                            {isLoginMode ? (
                                // Login Form
                                <form onSubmit={handleLoginSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={loginData.email}
                                            onChange={handleLoginChange}
                                            className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium mb-1">
                                            Password
                                        </label>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            value={loginData.password}
                                            onChange={handleLoginChange}
                                            className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                            required
                                            showHelperText={false}
                                        />
                                        <div className="mt-1">
                                            <button
                                                type="button"
                                                onClick={() => router.push('/auth/forgot-password')}
                                                className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-300"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="secondary"
                                        disabled={isLoading}
                                        className={`w-full py-3  transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        {isLoading ? 'Logging in...' : 'Login'}
                                    </Button>
                                </form>
                            ) : (
                                // Signup Form
                                <form onSubmit={handleSignupSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium mb-1">
                                                Full Name *
                                            </label>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                value={signupData.name}
                                                onChange={handleSignupChange}
                                                className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="gender" className="block text-sm font-medium mb-1">
                                                Gender *
                                            </label>
                                            <select
                                                id="gender"
                                                name="gender"
                                                value={signupData.gender}
                                                onChange={handleSignupChange}
                                                className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                                required
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-3">
                                            <label htmlFor="age" className="block text-sm font-medium mb-1">
                                                Age *
                                            </label>
                                            <input
                                                id="age"
                                                name="age"
                                                type="number"
                                                value={signupData.age}
                                                onChange={handleSignupChange}
                                                className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                                required
                                                min="1"
                                                max="30"
                                            />
                                        </div>

                                        <div className="col-span-9">
                                            <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
                                                Email *
                                            </label>
                                            <input
                                                id="signup-email"
                                                name="email"
                                                type="email"
                                                value={signupData.email}
                                                onChange={handleSignupChange}
                                                className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium mb-1">
                                                Phone Number * (10 digits)
                                            </label>
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={signupData.phone}
                                                onChange={handleSignupChange}
                                                className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                                required
                                                pattern="[0-9]{10}"
                                                maxLength={10}
                                                placeholder="10-digit mobile number"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="emergencyContact" className="block text-sm font-medium mb-1">
                                                Emergency Contact
                                            </label>
                                            <input
                                                id="emergencyContact"
                                                name="emergencyContact"
                                                type="text"
                                                value={signupData.emergencyContact}
                                                onChange={handleSignupChange}
                                                className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="instagramUsername" className="block text-sm font-medium mb-1">
                                                Instagram Username *
                                            </label>
                                            <input
                                                id="instagramUsername"
                                                name="instagramUsername"
                                                type="text"
                                                value={signupData.instagramUsername}
                                                onChange={handleSignupChange}
                                                className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
                                                Password *
                                            </label>
                                            <PasswordInput
                                                id="signup-password"
                                                name="password"
                                                value={signupData.password}
                                                onChange={handleSignupChange}
                                                className="w-full p-3 border  focus:outline-none focus:ring-2 bg-zinc-900 border-zinc-700"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center mb-3">
                                        <input
                                            id="acceptTerms"
                                            name="acceptTerms"
                                            type="checkbox"
                                            checked={signupData.acceptTerms}
                                            onChange={handleSignupChange}
                                            className="h-4 w-4 text-white focus:ring-white border-zinc-700 rounded"
                                            required
                                        />
                                        <label htmlFor="acceptTerms" className="ml-2 block text-sm">
                                            I accept the <a href="/terms" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Terms and Conditions</a> *
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            id="joinCrew"
                                            name="joinCrew"
                                            type="checkbox"
                                            checked={signupData.joinCrew}
                                            onChange={handleSignupChange}
                                            className="h-4 w-4 text-white focus:ring-white border-zinc-700 rounded"
                                        />
                                        <label htmlFor="joinCrew" className="ml-2 block text-sm">
                                            I want to join the crew
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        variant="secondary"
                                        className={`w-full py-3  transition-colors hover:bg-zinc-200 mt-6 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        {isLoading ? 'Signing up...' : 'Sign Up'}
                                    </Button>
                                </form>
                            )}

                            <div className="mt-6 text-center">
                                <p className="text-zinc-400">
                                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
                                    <Button
                                        type="button"
                                        onClick={toggleMode}
                                        className="text-white hover:underline"
                                    >
                                        {isLoginMode ? 'Sign up' : 'Login'}
                                    </Button>
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
} 