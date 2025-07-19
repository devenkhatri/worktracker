"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { 
  User, 
  Clock, 
  Calendar,
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react';

interface UserInfo {
  username: string;
  lastLogin?: string;
  currentSession: string;
}

export function UserProfile() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/user-info');
        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }
        const data = await response.json();
        setUserInfo(data);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user info');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getTimeSince = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Unable to load user profile</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>User Profile</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{userInfo?.username}</p>
              <p className="text-sm text-muted-foreground">Username</p>
            </div>
          </div>

          {/* Current Session */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg">
            <Clock className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-600">Current Session</p>
              <p className="text-sm text-muted-foreground">
                Started: {formatDateTime(userInfo?.currentSession || '')}
              </p>
              <p className="text-xs text-muted-foreground">
                {getTimeSince(userInfo?.currentSession || '')}
              </p>
            </div>
          </div>

          {/* Last Login */}
          {userInfo?.lastLogin && (
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-600">Previous Login</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(userInfo.lastLogin)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getTimeSince(userInfo.lastLogin)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t">
          <Button 
            onClick={logout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}