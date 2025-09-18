'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import Loader from "@/components/ui/PixelLoader"


export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'luxury';
    size?: 'small' | 'medium' | 'large';
    isLoading?: boolean;
    loadingText?: string;
    href?: string;
    className?: string;
    fullWidth?: boolean;
    isExternal?: boolean;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    loadingText,
    href,
    className = '',
    fullWidth = false,
    isExternal = false,
    disabled,
    type = 'button',
    ...props
}: ButtonProps) {
    // Base classes for all buttons
    const baseClasses = 'cursor-pointer font-medium transition-colors focus:outline-none';

    // Size classes
    const sizeClasses = {
        small: 'py-1 px-3 text-sm',
        medium: 'py-2 px-4 text-base',
        large: 'py-3 px-6 text-lg',
    };

    // Variant classes (non-luxury)
    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-offset-2',
        secondary: 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300 focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2',
        outline: 'bg-transparent text-primary border border-primary hover:bg-primary/10 focus:ring-2 focus:ring-primary focus:ring-offset-2',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        luxury: 'luxury-button', // Use the existing luxury-button class
    };

    // Width class
    const widthClass = fullWidth ? 'w-full' : '';

    // Combine all classes
    const buttonClasses = `
    ${baseClasses} 
    ${variant !== 'luxury' ? sizeClasses[size] : ''} 
    ${variantClasses[variant]} 
    ${widthClass} 
    ${className}
    ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''}
  `.trim().replace(/\s+/g, ' ');

    // If href is provided, render as a Link
    if (href) {
        const linkProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};

        return (
            <Link
                href={href}
                className={buttonClasses}
                {...linkProps}
                aria-disabled={disabled || isLoading}
                onClick={(e) => {
                    if (disabled || isLoading) {
                        e.preventDefault();
                    }
                }}
            >
                {isLoading ? (
                    <>
                        <Loader text={loadingText || children as string} />
                    </>
                ) : (
                    children
                )}
            </Link>
        );
    }

    // Otherwise render as a button
    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <Loader text={loadingText || children as string} />
                </>
            ) : (
                children
            )}
        </button>
    );
}
