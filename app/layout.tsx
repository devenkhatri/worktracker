import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ClientLayout } from '@/components/layout/client-layout';
import { FloatingTickerButton } from '@/components/time-tracker/floating-ticker-button';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WorkTracker - Project Management System',
  description: 'Comprehensive work tracking application with Google Sheets integration',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayout>
            {children}
            <FloatingTickerButton />
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}