"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, Task, TimeEntry } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProjects = selectedProject === 'all' 
    ? projects 
    : projects.filter(p => p.id === selectedProject);

  const filteredTasks = selectedProject === 'all' 
    ? tasks 
    : tasks.filter(t => t.projectId === selectedProject);

  const filteredTimeEntries = selectedProject === 'all' 
    ? timeEntries 
    : timeEntries.filter(e => e.projectId === selectedProject);

  // Project status distribution
  const statusData = [
    { name: 'Not Started', value: filteredProjects.filter(p => p.status === 'Not Started').length, color: '#94a3b8' },
    { name: 'In Progress', value: filteredProjects.filter(p => p.status === 'In Progress').length, color: '#3b82f6' },
    { name: 'Completed', value: filteredProjects.filter(p => p.status === 'Completed').length, color: '#10b981' },
    { name: 'On Hold', value: filteredProjects.filter(p => p.status === 'On Hold').length, color: '#f59e0b' },
  ];

  // Project hours comparison
  const hoursData = filteredProjects.map(project => ({
    name: project.projectName.length > 15 ? project.projectName.substring(0, 15) + '...' : project.projectName,
    estimated: project.totalEstimatedHours,
    actual: project.totalActualHours,
    billed: project.totalBilledHours,
  }));

  // Task priority distribution
  const priorityData = [
    { name: 'High', value: filteredTasks.filter(t => t.priority === 'High').length, color: '#ef4444' },
    { name: 'Medium', value: filteredTasks.filter(t => t.priority === 'Medium').length, color: '#f59e0b' },
    { name: 'Low', value: filteredTasks.filter(t => t.priority === 'Low').length, color: '#10b981' },
  ];

  // Revenue by project
  const revenueData = filteredProjects.map(project => ({
    name: project.projectName.length > 15 ? project.projectName.substring(0, 15) + '...' : project.projectName,
    revenue: project.totalAmount,
    budget: project.budget,
  }));

  const exportReport = () => {
    const reportData = {
      projects: filteredProjects,
      tasks: filteredTasks,
      timeEntries: filteredTimeEntries,
      summary: {
        totalProjects: filteredProjects.length,
        totalTasks: filteredTasks.length,
        totalHours: filteredTimeEntries.reduce((sum, entry) => sum + entry.duration, 0),
        totalRevenue: filteredProjects.reduce((sum, project) => sum + project.totalAmount, 0),
      }
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `work-tracker-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze project performance and track progress
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProjects.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTasks.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTimeEntries.reduce((sum, entry) => sum + entry.duration, 0).toFixed(1)}h
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{filteredProjects.reduce((sum, project) => sum + project.totalAmount, 0).toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Hours Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="estimated" fill="#94a3b8" name="Estimated" />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual" />
                <Bar dataKey="billed" fill="#10b981" name="Billed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="budget" fill="#f59e0b" name="Budget" />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}