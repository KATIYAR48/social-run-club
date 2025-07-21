'use client';

import React from 'react';
import Button from './Button';

interface LoadingButtonProps {
    isLoading: boolean;
    text: string;
    loadingText?: string;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'small' | 'medium' | 'large';
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    href?: string;
    fullWidth?: boolean;
}

export default function LoadingButton({
    isLoading,
    text,
    loadingText,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    className = '',
    disabled = false,
    onClick,
    href,
    fullWidth = false,
}: LoadingButtonProps) {
    console.log('LoadingButton render:', { text, isLoading }); // Debug log
    return (
        <Button
            type={type}
            variant={variant}
            size={size}
            className={className}
            disabled={disabled}
            isLoading={isLoading}
            loadingText={loadingText}
            onClick={onClick}
            href={href}
            fullWidth={fullWidth}
        >
            {text}
        </Button>
    );
} 