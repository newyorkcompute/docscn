import './global.css';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata = {
  title: 'docscn',
  description:
    'Open-source workspace for publishing, reviewing, and revising agent-generated HTML artifacts.',
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
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
