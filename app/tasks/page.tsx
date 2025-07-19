"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { TaskForm } from '@/components/task-form';
import { ConfigVerification } from '@/components/config-verification';
import { Project, Task, TimeEntry } from '@/lib/types';
import { Plus, Loader2, AlertCircle, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [configValid, setConfigValid] = useState<boolean | null>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Tasks: Starting data fetch...');
        const [tasksResponse, projectsResponse, timeEntriesResponse] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/projects'),
          fetch('/api/time-entries')
        ]);

        console.log('Tasks: Response statuses:', {
          tasks: tasksResponse.status,
          projects: projectsResponse.status,
          timeEntries: timeEntriesResponse.status
        });

        if (!tasksResponse.ok || !projectsResponse.ok || !timeEntriesResponse.ok) {
          const tasksError = !tasksResponse.ok ? await tasksResponse.text() : null;
          const projectsError = !projectsResponse.ok ? await projectsResponse.text() : null;
          const timeEntriesError = !timeEntriesResponse.ok ? await timeEntriesResponse.text() : null;
          console.error('Tasks: API errors:', { tasksError, projectsError, timeEntriesError });
          
          // Check if it's a configuration error
          const errorText = tasksError || projectsError || timeEntriesError || '';
          if (errorText.includes('configuration') || errorText.includes('environment')) {
            setConfigValid(false);
            setError('Configuration issue detected. Please verify your Google Sheets setup.');
          } else {
            throw new Error(`Failed to fetch data: ${errorText}`);
          }
          return;
        }

        const tasksData = await tasksResponse.json();
        const projectsData = await projectsResponse.json();
        const timeEntriesData = await timeEntriesResponse.json();

        console.log('Tasks: Data received:', {
          tasksCount: tasksData.length,
          projectsCount: projectsData.length,
          timeEntriesCount: timeEntriesData.length
        });

        setTasks(tasksData);
        setProjects(projectsData);
        setTimeEntries(timeEntriesData);
        setConfigValid(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setConfigValid(false);
        setError(err instanceof Error ? err.message : 'Failed to load tasks. Please check your Google Sheets configuration.');
      } finally {
        setLoading(false);
      }
    };

    console.log('Tasks: Starting fetch, configValid:', configValid);
    fetchData();
  }, []);

  const handleConfigurationChange = (isValid: boolean) => {
    console.log('Tasks: Configuration changed to:', isValid);
    setConfigValid(isValid);
    if (isValid) {
      setLoading(true);
      setError(null);
      // Retry fetching data when config becomes valid
      const fetchData = async () => {
        try {
          console.log('Tasks: Retrying data fetch after config fix...');
          const [tasksResponse, projectsResponse, timeEntriesResponse] = await Promise.all([
            fetch('/api/tasks'),
            fetch('/api/projects'),
            fetch('/api/time-entries')
          ]);

          if (!tasksResponse.ok || !projectsResponse.ok || !timeEntriesResponse.ok) {
            const tasksError = !tasksResponse.ok ? await tasksResponse.text() : null;
            const projectsError = !projectsResponse.ok ? await projectsResponse.text() : null;
            const timeEntriesError = !timeEntriesResponse.ok ? await timeEntriesResponse.text() : null;
            throw new Error(`Failed to fetch data: ${tasksError || projectsError || timeEntriesError}`);
          }

          const tasksData = await tasksResponse.json();
          const projectsData = await projectsResponse.json();
          const timeEntriesData = await timeEntriesResponse.json();

          setTasks(tasksData);
          setProjects(projectsData);
          setTimeEntries(timeEntriesData);
          setError(null);
        } catch (err) {
          console.error('Error retrying tasks fetch:', err);
          setError(err instanceof Error ? err.message : 'Failed to load tasks');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'actualHours' | 'calculatedAmount'>) => {
    try {
      if (editingTask) {
        console.log('Updating task with data:', taskData);
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Task update failed:', errorText);
          
          let errorMessage = 'Failed to update task';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorText;
          } catch {
            errorMessage = errorText || 'Failed to update task';
          }
          
          throw new Error(errorMessage);
        }

        const updatedTask = await response.json();
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
      } else {
        console.log('Creating task with data:', taskData);
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Task creation failed:', errorText);
          
          let errorMessage = 'Failed to create task';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorText;
          } catch {
            errorMessage = errorText || 'Failed to create task';
          }
          
          throw new Error(errorMessage);
        }

        const newTask = await response.json();
        setTasks(prev => [...prev, newTask]);
      }
      
      setShowForm(false);
      setEditingTask(null);
    } catch (err) {
      console.error('Error saving task:', err);
      setError(editingTask ? 'Failed to update task. Please try again.' : 'Failed to create task. Please try again.');
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? `${project.projectName} - ${project.clientName}` : 'Unknown Project';
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const getTimeEntriesForTask = (taskId: string) => {
    return timeEntries.filter(entry => entry.taskId === taskId);
  };

  const columns = [
    { key: 'id', label: 'Task ID', sortable: true },
    { key: 'taskName', label: 'Task Name', sortable: true },
    { 
      key: 'projectId', 
      label: 'Project', 
      sortable: true,
      render: (value: string) => getProjectName(value)
    },
    { key: 'assignedTo', label: 'Assigned To', sortable: true },
    { key: 'priority', label: 'Priority', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'dueDate', label: 'Due Date', sortable: true },
    { 
      key: 'estimatedHours', 
      label: 'Est. Hours', 
      sortable: true,
      render: (value: number) => `${value}h`
    },
    { 
      key: 'actualHours', 
      label: 'Actual Hours', 
      sortable: true,
      render: (value: number) => `${value}h`
    },
    { 
      key: 'calculatedAmount', 
      label: 'Amount', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, task: Task) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditTask(task)}
          className="flex items-center space-x-1 text-xs sm:text-sm"
        >
          <Edit className="h-3 w-3" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      )
    },
  ];

  const renderExpandedRow = (task: Task) => {
    const taskTimeEntries = getTimeEntriesForTask(task.id);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Task Details</h4>
            <p className="text-sm text-muted-foreground mb-2 break-words">{task.taskDescription}</p>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Task Rate:</span> ₹{task.taskPerHourRate}/hour
              </p>
              <p className="text-sm">
                <span className="font-medium">Billed Hours:</span> {task.billedHours}h
              </p>
              {task.artifacts && (
                <p className="text-sm break-words">
                  <span className="font-medium">Artifacts:</span> {task.artifacts}
                </p>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Time Entries ({taskTimeEntries.length})</h4>
            <div className="space-y-1">
              {taskTimeEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="truncate flex-1">{entry.date}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">{entry.duration.toFixed(1)}h</span>
                </div>
              ))}
              {taskTimeEntries.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  And {taskTimeEntries.length - 5} more entries...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none pb-4 mb-6 lg:pb-0 lg:mb-0 lg:static">
          <div className="pt-12 lg:pt-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {editingTask ? 'Update task details' : 'Add a new task to an existing project'}
            </p>
          </div>
        </div>

        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={handleCancelEdit}
          projects={projects}
          initialData={editingTask || undefined}
          isEditing={!!editingTask}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none pb-4 mb-6 lg:pb-0 lg:mb-0 lg:static">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage tasks and track their progress
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {configValid === false && (
        <ConfigVerification onConfigurationValid={handleConfigurationChange} />
      )}

      <DataTable
        data={tasks}
        columns={columns}
        searchPlaceholder="Search tasks..."
        expandableRows
        renderExpandedRow={renderExpandedRow}
      />
    </div>
  );
}