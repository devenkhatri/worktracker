"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KanbanBoardNative } from '@/components/kanban/kanban-board-native';
import { TaskDetailModal } from '@/components/kanban/task-detail-modal';
import { Project, Task } from '@/lib/types';
import { Loader2, AlertCircle, Kanban } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch tasks when project is selected
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const allTasks = await response.json();
        const projectTasks = allTasks.filter((task: Task) => task.projectId === selectedProjectId);
        setTasks(projectTasks);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasks();
  }, [selectedProjectId]);

  const handleTaskStatusUpdate = async (taskId: string, newStatus: Task['status']) => {
    try {
      // Optimistically update the UI
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      // Update the task status via API
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      console.log(`Task ${taskId} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert the optimistic update on error
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: task.status } : task
        )
      );
      setError(err instanceof Error ? err.message : 'Failed to update task status');
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleTaskOpen = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskModalClose = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <Kanban className="h-8 w-8" />
            <span>Kanban Board</span>
          </h1>
          <p className="text-muted-foreground">
            Drag and drop tasks to update their status
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a project to view its tasks" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectName} - {project.clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedProject && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium">{selectedProject.projectName}</h3>
              <p className="text-sm text-muted-foreground">{selectedProject.projectDescription}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span>Client: <strong>{selectedProject.clientName}</strong></span>
                <span>Status: <strong>{selectedProject.status}</strong></span>
                <span>Tasks: <strong>{tasks.length}</strong></span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {selectedProjectId && (
        <div className="min-h-[600px]">
          {tasksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            </div>
          ) : (
            <KanbanBoardNative 
              tasks={tasks} 
              onTaskStatusUpdate={handleTaskStatusUpdate}
              onTaskOpen={handleTaskOpen}
            />
          )}
        </div>
      )}

      {selectedProjectId && !tasksLoading && tasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Kanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Tasks Found</h3>
            <p className="text-muted-foreground">
              This project doesn't have any tasks yet. Create some tasks to see them on the Kanban board.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        project={selectedProject}
        isOpen={isTaskModalOpen}
        onClose={handleTaskModalClose}
      />
    </div>
  );
}