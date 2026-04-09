import './global.css';
import { RootProvider } from '@hanzo/docs/ui/provider/base';
import { NextProvider } from '@hanzo/docs/core/framework/next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { SearchDialog } from '@/components/search-dialog';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Zoo Improvement Proposals (ZIPs) - Decentralized AI & Conservation Standards',
    template: '%s | ZIPs',
  },
  description: 'Standards and improvement proposals for the Zoo ecosystem - community-driven governance for decentralized AI, wildlife conservation, and open science.',
  keywords: ['Zoo', 'ZIPs', 'proposals', 'governance', 'AI', 'DeFi', 'NFT', 'conservation', 'DeSci'],
  authors: [{ name: 'Zoo Labs Foundation' }],
  metadataBase: new URL('https://zips.zoo.ngo'),
  openGraph: {
    title: 'Zoo Improvement Proposals (ZIPs) - Decentralized AI & Conservation Standards',
    description: 'Explore the technical foundations of the Zoo ecosystem - standards for decentralized AI, wildlife conservation, open science, and community governance.',
    type: 'website',
    siteName: 'Zoo Improvement Proposals',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Zoo Improvement Proposals - Decentralized AI & Conservation Standards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zoo Improvement Proposals (ZIPs) - Decentralized AI & Conservation Standards',
    description: 'Standards for the Zoo ecosystem - decentralized AI, conservation, DeFi, and more.',
    images: ['/twitter.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent flash - respect system preference or stored preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('zoo-zips-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (stored !== 'light' && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-svh bg-background font-sans antialiased">
        <NextProvider>
          <RootProvider
            search={{
              enabled: false,
            }}
            theme={{
              enabled: true,
              defaultTheme: 'system',
              storageKey: 'zoo-zips-theme',
            }}
          >
            <SearchDialog />
            <div className="relative flex min-h-svh flex-col bg-background">
              {children}
            </div>
          </RootProvider>
        </NextProvider>
      </body>
    </html>
  );
}
