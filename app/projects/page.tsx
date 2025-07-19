"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ProjectForm } from '@/components/project-form';
import { ConfigVerification } from '@/components/config-verification';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Project, Task } from '@/lib/types';
import { Plus, Loader2, AlertCircle, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [configValid, setConfigValid] = useState<boolean | null>(true); // Start with true to attempt loading

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Projects: Starting data fetch...');
        const [projectsResponse, tasksResponse] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/tasks')
        ]);

        console.log('Projects: Response statuses:', {
          projects: projectsResponse.status,
          tasks: tasksResponse.status
        });

        if (!projectsResponse.ok || !tasksResponse.ok) {
          const projectsError = !projectsResponse.ok ? await projectsResponse.text() : null;
          const tasksError = !tasksResponse.ok ? await tasksResponse.text() : null;
          console.error('Projects: API errors:', { projectsError, tasksError });
          
          // Check if it's a configuration error
          const errorText = projectsError || tasksError || '';
          if (errorText.includes('configuration') || errorText.includes('environment')) {
            setConfigValid(false);
            setError('Configuration issue detected. Please verify your Google Sheets setup.');
          } else {
            throw new Error(`Failed to fetch data: ${errorText}`);
          }
          return;
        }

        const projectsData = await projectsResponse.json();
        const tasksData = await tasksResponse.json();

        console.log('Projects: Data received:', {
          projectsCount: projectsData.length,
          tasksCount: tasksData.length
        });

        setProjects(projectsData);
        setTasks(tasksData);
        setConfigValid(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setConfigValid(false);
        setError(err instanceof Error ? err.message : 'Failed to load projects. Please check your Google Sheets configuration.');
      } finally {
        setLoading(false);
      }
    };

    console.log('Projects: Starting fetch, configValid:', configValid);
    fetchData();
  }, []); // Remove configValid dependency to prevent infinite loops

  const handleConfigurationChange = (isValid: boolean) => {
    console.log('Projects: Configuration changed to:', isValid);
    setConfigValid(isValid);
    if (isValid) {
      setLoading(true);
      setError(null);
      // Retry fetching data when config becomes valid
      const fetchData = async () => {
        try {
          console.log('Projects: Retrying data fetch after config fix...');
          const [projectsResponse, tasksResponse] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/tasks')
          ]);

          if (!projectsResponse.ok || !tasksResponse.ok) {
            const projectsError = !projectsResponse.ok ? await projectsResponse.text() : null;
            const tasksError = !tasksResponse.ok ? await tasksResponse.text() : null;
            throw new Error(`Failed to fetch data: ${projectsError || tasksError}`);
          }

          const projectsData = await projectsResponse.json();
          const tasksData = await tasksResponse.json();

          setProjects(projectsData);
          setTasks(tasksData);
          setError(null);
        } catch (err) {
          console.error('Error retrying projects fetch:', err);
          setError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'totalActualHours' | 'totalAmount'>) => {
    try {
      if (editingProject) {
        console.log('Updating project with data:', projectData);
        const response = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Project update failed:', errorText);
          
          let errorMessage = 'Failed to update project';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorText;
          } catch {
            errorMessage = errorText || 'Failed to update project';
          }
          
          throw new Error(errorMessage);
        }

        const updatedProject = await response.json();
        setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
      } else {
        console.log('Creating project with data:', projectData);
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Project creation failed:', errorText);
          
          let errorMessage = 'Failed to create project';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorText;
          } catch {
            errorMessage = errorText || 'Failed to create project';
          }
          
          throw new Error(errorMessage);
        }

        const newProject = await response.json();
        setProjects(prev => [...prev, newProject]);
      }
      
      setShowForm(false);
      setEditingProject(null);
    } catch (err) {
      console.error('Error saving project:', err);
      setError(editingProject ? 'Failed to update project. Please try again.' : 'Failed to create project. Please try again.');
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  const getTasksForProject = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const columns = [
    { key: 'id', label: 'Project ID', sortable: true },
    { key: 'projectName', label: 'Project Name', sortable: true },
    { key: 'clientName', label: 'Client Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'startDate', label: 'Start Date', sortable: true },
    { key: 'endDate', label: 'End Date', sortable: true },
    { 
      key: 'budget', 
      label: 'Budget', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
    { 
      key: 'totalEstimatedHours', 
      label: 'Est. Hours', 
      sortable: true,
      render: (value: number) => `${value}h`
    },
    { 
      key: 'totalActualHours', 
      label: 'Actual Hours', 
      sortable: true,
      render: (value: number) => `${value}h`
    },
    { 
      key: 'totalAmount', 
      label: 'Total Amount', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, project: Project) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditProject(project)}
          className="flex items-center space-x-1"
        >
          <Edit className="h-3 w-3" />
          <span>Edit</span>
        </Button>
      )
    },
  ];

  const renderExpandedRow = (project: Project) => {
    const projectTasks = getTasksForProject(project.id);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Project Details</h4>
            <p className="text-sm text-muted-foreground mb-2">{project.projectDescription}</p>
            <p className="text-sm">
              <span className="font-medium">Per Hour Rate:</span> ₹{project.perHourRate}
            </p>
            <p className="text-sm">
              <span className="font-medium">Billed Hours:</span> {project.totalBilledHours}h
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Tasks ({projectTasks.length})</h4>
            <div className="space-y-1">
              {projectTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <span>{task.taskName}</span>
                  <span className="text-muted-foreground">{task.status}</span>
                </div>
              ))}
              {projectTasks.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  And {projectTasks.length - 5} more tasks...
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-muted-foreground">
            Add a new project to start tracking tasks and time
          </p>
        </div>

        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={handleCancelEdit}
          initialData={editingProject || undefined}
          isEditing={!!editingProject}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and track their progress
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
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

      {configValid === true && projects.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No Projects Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No projects were found in your Google Sheet. This could mean:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Your Projects worksheet is empty (no data rows)</li>
              <li>The data is in a different format than expected</li>
              <li>There might be an issue with the sheet structure</li>
            </ul>
            <div className="mt-4">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={projects}
        columns={columns}
        searchPlaceholder="Search projects..."
        expandableRows
        renderExpandedRow={renderExpandedRow}
      />
    </div>
  );
}