'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the User type
export interface User {
    _id: string;
    name: string;
    email: string;
    username: string;
    role: 'user' | 'admin' | 'super-admin';
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    emergencyContact?: string;
    instagramUsername?: string;
    joinCrew?: boolean;
}

// Define the AuthContext type
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    signup: (userData: SignupData) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateProfile: (userData: UpdateProfileData, currentPassword: string) => Promise<{ success: boolean; message: string }>;
}

// Define signup data type
export interface SignupData {
    name: string;
    email: string;
    username?: string;
    password: string;
    phone: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    emergencyContact?: string;
    instagramUsername?: string;
    joinCrew?: boolean;
}

// Define update profile data type
export interface UpdateProfileData {
    name: string;
    username?: string;
    phone: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    emergencyContact?: string;
    instagramUsername?: string;
    joinCrew?: boolean;
    newPassword?: string;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    login: async () => ({ success: false, message: 'AuthContext not initialized' }),
    signup: async () => ({ success: false, message: 'AuthContext not initialized' }),
    logout: async () => { },
    refreshUser: async () => { },
    updateProfile: async () => ({ success: false, message: 'AuthContext not initialized' }),
});

// Create a provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Function to fetch the current user
    const refreshUser = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Check authentication status on mount
    useEffect(() => {
        refreshUser();
    }, []);

    // Login function
    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                await refreshUser();
                return { success: true, message: 'Login successful' };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred during login' };
        }
    };

    // Signup function
    const signup = async (userData: SignupData) => {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (response.ok) {
                await refreshUser();
                return { success: true, message: 'Signup successful' };
            } else {
                return { success: false, message: data.message || 'Signup failed' };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'An error occurred during signup' };
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Update profile function
    const updateProfile = async (userData: UpdateProfileData, currentPassword: string) => {
        try {
            const response = await fetch('/api/auth/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...userData, currentPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                await refreshUser();
                return { success: true, message: data.message || 'Profile updated successfully' };
            } else {
                return { success: false, message: data.message || 'Profile update failed' };
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'An error occurred during profile update' };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                signup,
                logout,
                refreshUser,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 