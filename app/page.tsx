"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStatsComponent } from '@/components/dashboard-stats';
import { ConfigVerification } from '@/components/config-verification';
import { RecentActivities } from '@/components/recent-activities';
import { QuickActions } from '@/components/quick-actions';
import { DashboardStats } from '@/lib/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configValid, setConfigValid] = useState<boolean | null>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Dashboard: Fetching stats...');
        const response = await fetch('/api/dashboard');
        console.log('Dashboard: Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Dashboard: Error response:', errorText);
          // If it's a config error, show config verification
          if (response.status === 500 && errorText.includes('configuration')) {
            setConfigValid(false);
            setError('Configuration issue detected. Please verify your Google Sheets setup.');
          } else {
            throw new Error(`Failed to fetch dashboard stats: ${errorText}`);
          }
          return;
        }
        
        const data = await response.json();
        console.log('Dashboard: Data received:', data);
        setStats(data);
        setConfigValid(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setConfigValid(false);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data. Please check your Google Sheets configuration.');
      } finally {
        setLoading(false);
      }
    };

    console.log('Dashboard: Starting fetch, configValid:', configValid);
    fetchStats();
  }, []); // Remove configValid dependency to prevent infinite loops

  const handleConfigurationChange = (isValid: boolean) => {
    console.log('Dashboard: Configuration changed to:', isValid);
    setConfigValid(isValid);
    if (isValid) {
      setLoading(true);
      setError(null);
      // Retry fetching data when config becomes valid
      const fetchStats = async () => {
        try {
          console.log('Dashboard: Retrying stats fetch after config fix...');
          const response = await fetch('/api/dashboard');
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch dashboard stats: ${errorText}`);
          }
          
          const data = await response.json();
          setStats(data);
          setError(null);
        } catch (err) {
          console.error('Error retrying dashboard stats:', err);
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (configValid === false) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your project management dashboard
          </p>
        </div>
        
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <ConfigVerification onConfigurationValid={handleConfigurationChange} />

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>To get started with WorkTracker, you'll need to:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Set up your Google Sheets API credentials</li>
                <li>Create a Google Sheet with the required worksheets</li>
                <li>Configure your environment variables</li>
                <li>Start tracking your projects and tasks</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your project management dashboard
          </p>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your project management dashboard
        </p>
      </div>

      {stats && <DashboardStatsComponent stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivities limit={5} />
        <QuickActions />
      </div>
    </div>
  );
}