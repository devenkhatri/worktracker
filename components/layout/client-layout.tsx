"use client";

import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { loading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/login';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    // This will be handled by middleware, but just in case
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-3 sm:p-4 lg:p-6 min-w-0">
        <div className="max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}