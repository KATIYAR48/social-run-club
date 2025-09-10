'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface QRScannerProps {
    onScan: (result: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

export default function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);

    const stopScanner = useCallback(() => {
        if (readerRef.current) {
            // Stop all video tracks
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            readerRef.current = null;
        }
    }, []);

    const handleScanSuccess = useCallback((result: string) => {
        stopScanner();
        onScan(result);
    }, [onScan, stopScanner]);

    const initializeScanner = useCallback(async () => {
        try {
            setError(null);

            // Check for camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment' // Use back camera on mobile
                }
            });

            setHasPermission(true);

            // Stop the test stream
            stream.getTracks().forEach(track => track.stop());

            // Initialize the QR code reader
            readerRef.current = new BrowserMultiFormatReader();

            // Start scanning
            await readerRef.current.decodeFromVideoDevice(
                undefined, // Use default camera
                videoRef.current!,
                (result, error) => {
                    if (result) {
                        handleScanSuccess(result.getText());
                    }
                    if (error) {
                        // Only show error for non-expected errors (not "no code found")
                        if (error.name !== 'NotFoundException' && error.message !== 'No MultiFormat Readers were able to detect the code.') {
                            console.error('QR scan error:', error);
                            setError('Failed to scan QR code. Please try again.');
                        }
                    }
                }
            );

        } catch (err) {
            console.error('Camera initialization error:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError('Camera permission denied. Please allow camera access to scan QR codes.');
                    setHasPermission(false);
                } else if (err.name === 'NotFoundError') {
                    setError('No camera found. Please ensure your device has a camera.');
                } else {
                    setError('Failed to access camera. Please try again.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        }
    }, [handleScanSuccess]);

    useEffect(() => {
        if (isOpen) {
            initializeScanner();
        } else {
            stopScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isOpen, initializeScanner, stopScanner]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, [stopScanner]);

    const handleRetry = () => {
        setError(null);
        initializeScanner();
    };

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            >
                <div className="w-full h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
                        <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
                        <button
                            onClick={handleClose}
                            className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Camera View */}
                    <div className="flex-1 relative bg-black">
                        {hasPermission === false ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <div className="w-16 h-16 mb-4 text-red-500">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Camera Access Required</h3>
                                <p className="text-zinc-400 mb-6">{error}</p>
                                <Button onClick={handleRetry} variant="secondary">
                                    Try Again
                                </Button>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <div className="w-16 h-16 mb-4 text-red-500">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Scan Error</h3>
                                <p className="text-zinc-400 mb-6">{error}</p>
                                <Button onClick={handleRetry} variant="secondary">
                                    Try Again
                                </Button>
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    playsInline
                                    muted
                                />

                                {/* Scanning Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                                        {/* Corner indicators */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>

                                        {/* Scanning line animation */}
                                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white animate-pulse"></div>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                                    <p className="text-white text-lg font-medium mb-2">Position QR code in frame</p>
                                    <p className="text-zinc-400 text-sm">Make sure the QR code is clearly visible</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-black/80 backdrop-blur-sm">
                        <Button
                            onClick={handleClose}
                            variant="secondary"
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
