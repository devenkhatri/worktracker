"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimeEntry, Project, Task } from '@/lib/types';

interface TimeEntryFormProps {
  onSubmit: (timeEntry: Omit<TimeEntry, 'id' | 'duration'>) => void;
  onCancel: () => void;
  projects: Project[];
  tasks: Task[];
  initialData?: Partial<TimeEntry>;
  isEditing?: boolean;
}

export function TimeEntryForm({ onSubmit, onCancel, projects, tasks, initialData, isEditing = false }: TimeEntryFormProps) {
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || '',
    taskId: initialData?.taskId || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    description: initialData?.description || '',
    userName: initialData?.userName || 'System User', // TODO: Get from auth context
  });

  const [calculatedDuration, setCalculatedDuration] = useState<string>('');

  // Filter tasks based on selected project
  const filteredTasks = tasks.filter(task => task.projectId === formData.projectId);

  // Calculate duration when start/end times change
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const duration = calculateDuration(formData.startTime, formData.endTime);
      setCalculatedDuration(duration);
    } else {
      setCalculatedDuration('');
    }
  }, [formData.startTime, formData.endTime]);

  const calculateDuration = (start: string, end: string): string => {
    if (!start || !end) return '';
    
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    return hours > 0 ? `${hours.toFixed(2)} hours` : '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Time Entry' : 'Log Time Entry'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectId">Project</Label>
              <Select value={formData.projectId} onValueChange={(value) => handleInputChange('projectId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectName} - {project.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="taskId">Task</Label>
              <Select 
                value={formData.taskId} 
                onValueChange={(value) => handleInputChange('taskId', value)}
                disabled={!formData.projectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.taskName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          {calculatedDuration && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Duration: {calculatedDuration}</p>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="Describe the work performed..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {isEditing ? 'Update Entry' : 'Log Time'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}