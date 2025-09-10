'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/QRScanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function QRScannerPage() {
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const router = useRouter();

    const handleScan = (result: string) => {
        try {
            // Parse the QR code result
            const url = new URL(result);

            // Check if it's a valid check-in URL
            if (url.pathname === '/check-in' && url.searchParams.has('eventId') && url.searchParams.has('token')) {
                // Extract the parameters
                const eventId = url.searchParams.get('eventId');
                const token = url.searchParams.get('token');

                // Redirect to check-in page with the scanned parameters
                router.push(`/check-in?eventId=${eventId}&token=${token}`);
            } else {
                // Handle other types of QR codes or invalid URLs
                alert('This QR code is not a valid event check-in code. Please scan the QR code displayed at the event venue.');
            }
        } catch (error) {
            console.error('Error parsing QR code:', error);
            alert('Invalid QR code format. Please scan the QR code displayed at the event venue.');
        }
    };

    const handleOpenScanner = () => {
        setIsScannerOpen(true);
    };

    const handleCloseScanner = () => {
        setIsScannerOpen(false);
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-black text-white py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-3xl font-bold mb-4">QR Code Scanner</h1>
                        <p className="text-zinc-400 text-lg">
                            Scan the QR code at the event venue to check in
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-black border border-zinc-800 p-8 rounded-lg"
                    >
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-6 text-zinc-600">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-semibold mb-4">Ready to Check In?</h2>
                            <p className="text-zinc-400 mb-8">
                                Tap the button below to open the camera and scan the QR code displayed at the event venue.
                            </p>

                            <button
                                onClick={handleOpenScanner}
                                className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors text-lg"
                            >
                                Open Camera Scanner
                            </button>

                            <div className="mt-8 p-4 bg-zinc-900 rounded-lg">
                                <h3 className="font-semibold mb-2">How to use:</h3>
                                <ol className="text-sm text-zinc-400 space-y-1 text-left">
                                    <li>1. Tap "Open Camera Scanner"</li>
                                    <li>2. Allow camera permission when prompted</li>
                                    <li>3. Point your camera at the QR code</li>
                                    <li>4. Wait for the code to be recognized automatically</li>
                                    <li>5. You'll be redirected to the check-in page</li>
                                </ol>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            <Footer />

            {/* QR Scanner Modal */}
            <QRScanner
                isOpen={isScannerOpen}
                onScan={handleScan}
                onClose={handleCloseScanner}
            />
        </>
    );
}
