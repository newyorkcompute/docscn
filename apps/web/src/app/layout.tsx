import './global.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { getAppOrigin } from '../lib/app-origin';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-family-display',
  display: 'swap',
  adjustFontFallback: true,
  preload: false,
});

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-family-sans',
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-family-mono',
  display: 'swap',
  preload: false,
});

const appOrigin = getAppOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(appOrigin),
  title: {
    default: 'docscn',
    template: '%s | docscn',
  },
  description:
    'Open-source platform for hosting, sharing, and collaborating on AI-generated HTML artifacts.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appOrigin,
    siteName: 'docscn',
    title: 'docscn',
    description:
      'Open-source platform for hosting, sharing, and collaborating on AI-generated HTML artifacts.',
    images: [
      {
        url: '/cover.jpg',
        width: 1280,
        height: 672,
        alt: 'docscn — publish, review, and revise HTML artifacts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'docscn',
    description:
      'Open-source platform for hosting, sharing, and collaborating on AI-generated HTML artifacts.',
    images: ['/cover.jpg'],
  },
};

const themeScript = `
(() => {
  try {
    const theme = localStorage.getItem('docscn-theme') || 'system';
    const root = document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'light' || theme === 'dark') {
      root.classList.add(theme);
    }
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Script id="docscn-theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
