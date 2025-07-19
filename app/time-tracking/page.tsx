"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeTickerModal } from '@/components/time-tracker/time-ticker-modal';
import { TimeEntryForm } from '@/components/time-entry-form';
import { Project, Task, TimeEntry } from '@/lib/types';
import { 
  Clock, 
  Plus, 
  Timer,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Edit
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TimeTrackingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTicker, setShowTicker] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsResponse, tasksResponse, timeEntriesResponse] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/time-entries')
      ]);

      if (!projectsResponse.ok || !tasksResponse.ok || !timeEntriesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const projectsData = await projectsResponse.json();
      const tasksData = await tasksResponse.json();
      const timeEntriesData = await timeEntriesResponse.json();

      setProjects(projectsData);
      setTasks(tasksData);
      setTimeEntries(timeEntriesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeEntrySubmit = async (timeEntry: Omit<TimeEntry, 'id' | 'duration'>) => {
    try {
      if (editingTimeEntry) {
        console.log('Updating time entry with data:', timeEntry);
        const response = await fetch(`/api/time-entries/${editingTimeEntry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timeEntry),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Time entry update failed:', errorText);
          
          let errorMessage = 'Failed to update time entry';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorText;
          } catch {
            errorMessage = errorText || 'Failed to update time entry';
          }
          
          throw new Error(errorMessage);
        }

        const updatedTimeEntry = await response.json();
        setTimeEntries(prev => prev.map(te => te.id === editingTimeEntry.id ? updatedTimeEntry : te));
      } else {
        const response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(timeEntry),
        });

        if (!response.ok) {
          throw new Error('Failed to create time entry');
        }

        // Refresh data
        await fetchData();
      }
      
      setShowForm(false);
      setEditingTimeEntry(null);
    } catch (err) {
      console.error('Error saving time entry:', err);
      setError(editingTimeEntry ? 'Failed to update time entry. Please try again.' : 'Failed to create time entry. Please try again.');
    }
  };

  const handleEditTimeEntry = (timeEntry: TimeEntry) => {
    setEditingTimeEntry(timeEntry);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingTimeEntry(null);
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.projectName : 'Unknown Project';
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.taskName : 'Unknown Task';
  };

  // Get recent time entries (last 10)
  const recentTimeEntries = timeEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">Loading time tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none pb-4 mb-6 lg:pb-0 lg:mb-0 lg:static">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center space-x-2">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
              <span>Time Tracking</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Track time spent on projects and tasks
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              onClick={() => setShowTicker(true)}
              className="flex items-center justify-center space-x-2"
            >
              <Timer className="h-4 w-4" />
              <span>Start Timer</span>
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Manual Entry</span>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeEntries.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeEntries.reduce((sum, entry) => sum + entry.duration, 0).toFixed(1)}h
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeEntries
                .filter(entry => {
                  const entryDate = new Date(entry.date);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return entryDate >= weekAgo;
                })
                .reduce((sum, entry) => sum + entry.duration, 0)
                .toFixed(1)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTimeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Time Entries</h3>
              <p>Start tracking time to see your entries here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTimeEntries.map((entry) => (
                <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                      <h4 className="font-medium truncate">{getTaskName(entry.taskId)}</h4>
                      <span className="hidden sm:inline text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground truncate">{getProjectName(entry.projectId)}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(entry.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs sm:text-sm">{entry.startTime} - {entry.endTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-20 sm:max-w-none">{entry.userName}</span>
                      </div>
                    </div>
                    
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-2 break-words">{entry.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{formatDuration(entry.duration)}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTimeEntry(entry)}
                      className="flex items-center space-x-1 text-xs sm:text-sm"
                    >
                      <Edit className="h-3 w-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Ticker Modal */}
      <TimeTickerModal
        isOpen={showTicker}
        onClose={() => setShowTicker(false)}
        projects={projects}
        tasks={tasks}
        onTimeEntryCreated={fetchData}
      />

      {/* Manual Time Entry Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-4 sm:p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <TimeEntryForm
              onSubmit={handleTimeEntrySubmit}
              onCancel={handleCancelEdit}
              projects={projects}
              tasks={tasks}
              initialData={editingTimeEntry || undefined}
              isEditing={!!editingTimeEntry}
            />
          </div>
        </div>
      )}
    </div>
  );
}