"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Project, Task, TimeEntry } from '@/lib/types';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function ExportPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportOptions, setExportOptions] = useState({
    projects: true,
    tasks: true,
    timeEntries: true,
  });

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

  const convertToCSV = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const exportData = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const projectFilter = selectedProject === 'all' ? 'all-projects' : projects.find(p => p.id === selectedProject)?.projectName?.replace(/\s+/g, '-').toLowerCase() || 'selected-project';
    
    if (exportFormat === 'json') {
      const exportData: any = {};
      
      if (exportOptions.projects) {
        exportData.projects = filteredProjects;
      }
      if (exportOptions.tasks) {
        exportData.tasks = filteredTasks;
      }
      if (exportOptions.timeEntries) {
        exportData.timeEntries = filteredTimeEntries;
      }
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `worktracker-${projectFilter}-${timestamp}.json`);
      linkElement.click();
    } else {
      // CSV export
      const zipFiles: { filename: string; content: string }[] = [];
      
      if (exportOptions.projects && filteredProjects.length > 0) {
        const projectHeaders = ['id', 'projectName', 'clientName', 'projectDescription', 'startDate', 'endDate', 'status', 'budget', 'perHourRate', 'totalEstimatedHours', 'totalActualHours', 'totalBilledHours', 'totalAmount'];
        const projectCSV = convertToCSV(filteredProjects, projectHeaders);
        zipFiles.push({ filename: 'projects.csv', content: projectCSV });
      }
      
      if (exportOptions.tasks && filteredTasks.length > 0) {
        const taskHeaders = ['id', 'projectId', 'taskName', 'taskDescription', 'assignedTo', 'priority', 'status', 'estimatedHours', 'actualHours', 'billedHours', 'projectPerHourRate', 'taskPerHourRate', 'calculatedAmount', 'dueDate', 'artifacts'];
        const taskCSV = convertToCSV(filteredTasks, taskHeaders);
        zipFiles.push({ filename: 'tasks.csv', content: taskCSV });
      }
      
      if (exportOptions.timeEntries && filteredTimeEntries.length > 0) {
        const timeHeaders = ['id', 'projectId', 'taskId', 'date', 'startTime', 'endTime', 'duration', 'description', 'userName'];
        const timeCSV = convertToCSV(filteredTimeEntries, timeHeaders);
        zipFiles.push({ filename: 'time-entries.csv', content: timeCSV });
      }
      
      // For simplicity, we'll download the first file or combine all
      if (zipFiles.length === 1) {
        const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(zipFiles[0].content);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `worktracker-${projectFilter}-${zipFiles[0].filename.replace('.csv', '')}-${timestamp}.csv`);
        linkElement.click();
      } else {
        // Combine all CSV files
        const combinedContent = zipFiles.map(file => 
          `## ${file.filename.replace('.csv', '').toUpperCase()}\n${file.content}`
        ).join('\n\n');
        
        const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(combinedContent);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `worktracker-${projectFilter}-combined-${timestamp}.txt`);
        linkElement.click();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading export data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
        <p className="text-muted-foreground">
          Export your project data in various formats
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="project-select">Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectName} - {project.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="format-select">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
                <SelectTrigger id="format-select">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                  <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data to Export</Label>
              <div className="space-y-3 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="export-projects"
                    checked={exportOptions.projects}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, projects: checked as boolean }))
                    }
                  />
                  <Label htmlFor="export-projects">Projects ({filteredProjects.length})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="export-tasks"
                    checked={exportOptions.tasks}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, tasks: checked as boolean }))
                    }
                  />
                  <Label htmlFor="export-tasks">Tasks ({filteredTasks.length})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="export-time-entries"
                    checked={exportOptions.timeEntries}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, timeEntries: checked as boolean }))
                    }
                  />
                  <Label htmlFor="export-time-entries">Time Entries ({filteredTimeEntries.length})</Label>
                </div>
              </div>
            </div>

            <Button 
              onClick={exportData} 
              className="w-full"
              disabled={!exportOptions.projects && !exportOptions.tasks && !exportOptions.timeEntries}
            >
              {exportFormat === 'csv' ? (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Export Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Export Summary</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Project Filter: {selectedProject === 'all' ? 'All Projects' : projects.find(p => p.id === selectedProject)?.projectName}</p>
                  <p>Format: {exportFormat.toUpperCase()}</p>
                  <p>Data Types: {Object.entries(exportOptions).filter(([_, enabled]) => enabled).map(([type, _]) => type).join(', ')}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium">Data Count</h4>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{filteredProjects.length}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{filteredTasks.length}</div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{filteredTimeEntries.length}</div>
                    <div className="text-xs text-muted-foreground">Time Entries</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium">Export Notes</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• CSV exports are compatible with Excel and Google Sheets</p>
                  <p>• JSON exports preserve all data types and relationships</p>
                  <p>• Multiple CSV files will be combined into a single download</p>
                  <p>• All timestamps are in ISO format</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}