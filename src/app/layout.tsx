import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SimplePOS Pro',
  description: 'SimplePOS Pro',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextTopLoader
            color="#fbbf24" // amber-400
            initialPosition={0.08}
            crawlSpeed={200}
            height={2}
            crawl={true}
            showSpinner={false} // Re-enable spinner to help verify it's working
            easing="ease"
            speed={200}
            shadow="0 0 15px #fbbf24,0 0 8px #fbbf24"
            zIndex={100000}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
