import './globals.css';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ThemeProvider } from '../components/theme-provider';
import { Navbar } from '../components/navbar';
import { Footer } from '../components/footer';
import { PerformanceMonitor } from '../components/performance-monitor';
import { SkipLinks } from '../components/skip-links';
import Script from 'next/script';
import { AnalyticsListener } from '@/components/analytics-listener';
import { FirebaseProvider } from '../providers/firebase-provider';
import dynamic from 'next/dynamic';

const AscentChatBot = dynamic(() => import('../components/LeoChatBot'), { 
  ssr: false // Client-side hydration only for framer-motion chat bubble
});

export const metadata: Metadata = {
  metadataBase: new URL('https://d7leos.org'),
  title: {
    default: 'Leo District 306 D7',
    template: '%s · Leo District 306 D7'
  },
  description: 'Official website for Leo District 306 D7 — Fostering leadership through service by empowering youth, building communities, and creating impact across Colombo and Ratnapura districts.',
  keywords: ['Leo District 306 D7', 'Leo Clubs', 'Lions International', 'Youth Leadership', 'Community Service', 'Sri Lanka', 'Colombo', 'Ratnapura'],
  authors: [{ name: 'Leo District 306 D7' }],
  creator: 'Leo District 306 D7',
  publisher: 'Leo District 306 D7',
  alternates: {
    canonical: 'https://d7leos.org'
  },
  openGraph: {
    title: 'Leo District 306 D7',
    description: 'Fostering leadership through service by empowering youth, building communities, and creating impact across Colombo and Ratnapura districts.',
    url: 'https://d7leos.org',
    siteName: 'Leo District 306 D7',
    type: 'website',
    locale: 'en_US',
    images: [
      { 
        url: '/logos/dp.png', 
        width: 512, 
        height: 512, 
        alt: 'Leo District 306 D7 Logo',
        type: 'image/png'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leo District 306 D7',
    description: 'Fostering leadership through service by empowering youth, building communities, and creating impact.',
    images: ['/logos/dp.png'],
    creator: '@d7leos'
  },
  icons: {
    icon: [
      { url: '/logos/dp.png', sizes: '32x32', type: 'image/png' },
      { url: '/logos/dp.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/logos/dp.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/logos/dp.png'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  other: {
    'google-adsense-account': 'ca-pub-8462045006808921'
  },
  category: 'organization'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logos/dp.png" />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);} gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      <Script id="theme-init" strategy="beforeInteractive">
        {`
          try {
            var t = localStorage.getItem('theme');
            if (!t || t === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch (e) {}
        `}
      </Script>
      <Script id="structured-data" type="application/ld+json" strategy="beforeInteractive">
        {`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Leo District 306 D7",
            "alternateName": "D7 Leos",
            "url": "https://d7leos.org",
            "logo": "https://d7leos.org/logos/dp.png",
            "description": "Fostering leadership through service by empowering youth, building communities, and creating impact across Colombo and Ratnapura districts.",
            "foundingDate": "2025",
            "areaServed": [
              {
                "@type": "AdministrativeArea",
                "name": "Colombo District",
                "containedInPlace": {
                  "@type": "Country",
                  "name": "Sri Lanka"
                }
              },
              {
                "@type": "AdministrativeArea", 
                "name": "Ratnapura District",
                "containedInPlace": {
                  "@type": "Country",
                  "name": "Sri Lanka"
                }
              }
            ],
            "memberOf": {
              "@type": "Organization",
              "name": "Lions Clubs International"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+94776243300",
              "contactType": "customer service",
              "email": "leodistrict306d7@gmail.com"
            },
            "sameAs": [
              "https://www.facebook.com/share/1DwDCti87Y/",
              "https://instagram.com/d7leos",
              "https://tiktok.com/@d7leos",
              "https://linkedin.com/company/leo-district-306-d7",
              "https://youtube.com/@leodistrict306d7"
            ]
          }
        `}
      </Script>
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <FirebaseProvider>
            <SkipLinks />
            <PerformanceMonitor />
            <Suspense fallback={null}>
              <AnalyticsListener />
            </Suspense>
            <Navbar />
            <main id="main-content" className="flex-1 container mx-auto px-4 py-8" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <AscentChatBot />
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}