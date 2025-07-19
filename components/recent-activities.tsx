"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from '@/lib/types';
import { 
  FolderPlus, 
  CheckCircle, 
  Clock, 
  Edit, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface RecentActivitiesProps {
  limit?: number;
}

export function RecentActivities({ limit = 10 }: RecentActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/activities?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data = await response.json();
        setActivities(data);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [limit]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'project_created':
        return <FolderPlus className="h-4 w-4 text-blue-500" />;
      case 'project_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'task_created':
        return <FolderPlus className="h-4 w-4 text-purple-500" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'time_logged':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'project_updated':
      case 'task_updated':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'project_status_changed':
      case 'task_status_changed':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'project_created':
      case 'task_created':
        return 'bg-blue-100';
      case 'project_completed':
      case 'task_completed':
        return 'bg-green-100';
      case 'time_logged':
        return 'bg-orange-100';
      case 'project_updated':
      case 'task_updated':
        return 'bg-blue-100';
      case 'project_status_changed':
      case 'task_status_changed':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} days ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown time';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
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
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Unable to load recent activities</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>No recent activities</p>
            <p className="text-sm">Start creating projects and tasks to see activity here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                  {activity.userName && activity.userName !== 'System' && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">
                        by {activity.userName}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}