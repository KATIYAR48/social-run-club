import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { LoadingProvider } from "@/components/LoadingProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth-context";
import PageTransition from "@/components/PageTransition";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWADebugPanel from "@/components/PWADebugPanel";
import { ReactLenis } from "lenis/react";


export const metadata: Metadata = {
  title: "CLOKA - Beyond the Seen",
  description: "This isn't just a run club—it's your weekend crew. We hit the pavement, then unwind at our favorite café, sharing stories and good vibes. Big things are coming—don't miss out. See you Saturday?",
  keywords: "CLOKA, luxury clothing, Indian heritage, premium brand, Cloka Club, Run Club",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://cloka.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "CLOKA - Beyond the Seen",
    description: "This isn't just a run club—it's your weekend crew. We hit the pavement, then unwind at our favorite café, sharing stories and good vibes. Big things are coming—don't miss out. See you Saturday?",
    url: 'https://cloka.in',
    siteName: 'CLOKA',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'CLOKA Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "CLOKA - Beyond the Seen",
    description: "This isn't just a run club—it's your weekend crew. We hit the pavement, then unwind at our favorite café, sharing stories and good vibes. Big things are coming—don't miss out. See you Saturday?",
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Replace with actual verification code when available
  },
  // PWA specific metadata
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'CLOKA',
  },
  applicationName: 'CLOKA',
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CLOKA" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="CLOKA" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-orientations" content="portrait" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className="antialiased">
        <ReactLenis root options={{ lerp: 0.1, duration: 1.5, orientation: 'vertical', gestureOrientation: 'vertical', smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 2 }}>
          <ErrorBoundary>
            <LoadingProvider>
              <AuthProvider>
                <GoogleAnalytics />
                <PageTransition>
                  {children}
                </PageTransition>
                <PWAInstallPrompt />
                <PWADebugPanel />
              </AuthProvider>
            </LoadingProvider>
          </ErrorBoundary>
        </ReactLenis>
        <Script src="/register-sw.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
