import './global.css';
import Script from 'next/script';
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-family-display',
  display: 'swap',
});

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-family-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-family-mono',
  display: 'swap',
});

export const metadata = {
  title: 'docscn',
  description:
    'Open-source platform for hosting, sharing, and collaborating on AI-generated HTML artifacts.',
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
