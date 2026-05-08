import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP, Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';

const inter = Inter({
  weight: ['200', '300', '400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: false,
});

const notoSansJP = Noto_Sans_JP({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
  preload: false,
});

export const metadata: Metadata = {
  title: 'MAS - My Agent Simulation',
  description: '不動産投資・住宅ローン返済・借り換え・繰上げ返済シミュレーター。キャッシュフロー分析、売却シナリオ、税務明細まで網羅。',
  keywords: ['不動産投資', '住宅ローン', 'シミュレーター', 'キャッシュフロー', '借り換え', '繰上げ返済', 'MAS'],
  openGraph: {
    title: 'MAS - My Agent Simulation',
    description: '不動産投資・住宅ローンシミュレーター',
    type: 'website',
    locale: 'ja_JP',
    images: [{ url: '/mas-ogp.png', width: 1200, height: 400, alt: 'MAS - My Agent Simulation' }],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png',  sizes: '16x16',  type: 'image/png' },
      { url: '/icons/icon-32x32.png',  sizes: '32x32',  type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-167x167.png', sizes: '167x167', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MAS',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1C2B4A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className={`min-h-screen bg-neutral-50 ${notoSansJP.className}`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
