"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, Project } from '@/lib/types';

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'actualHours' | 'billedHours'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Task>;
  isEditing?: boolean;
  projects: Project[];
}

export function TaskForm({ onSubmit, onCancel, initialData, isEditing = false, projects }: TaskFormProps) {
  const [formData, setFormData] = useState({
    taskName: initialData?.taskName || '',
    projectId: initialData?.projectId || '',
    taskDescription: initialData?.taskDescription || '',
    priority: initialData?.priority || 'Medium' as Task['priority'],
    status: initialData?.status || 'To Do' as Task['status'],
    estimatedHours: initialData?.estimatedHours || 0,
    dueDate: initialData?.dueDate || '',
    assignedTo: initialData?.assignedTo || '',
    artifacts: initialData?.artifacts || '',
    projectPerHourRate: initialData?.projectPerHourRate || 0,
    taskPerHourRate: initialData?.taskPerHourRate || 0,
    calculatedAmount: initialData?.calculatedAmount || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taskName">Task Name</Label>
              <Input
                id="taskName"
                value={formData.taskName}
                onChange={(e) => handleInputChange('taskName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="projectId">Project</Label>
              <Select value={formData.projectId} onValueChange={(value) => handleInputChange('projectId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="taskDescription">Task Description</Label>
            <Textarea
              id="taskDescription"
              value={formData.taskDescription}
              onChange={(e) => handleInputChange('taskDescription', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => handleInputChange('estimatedHours', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                placeholder="Enter assignee name"
              />
            </div>
            <div>
              <Label htmlFor="artifacts">Artifacts/Deliverables</Label>
              <Input
                id="artifacts"
                value={formData.artifacts}
                onChange={(e) => handleInputChange('artifacts', e.target.value)}
                placeholder="Describe deliverables, outputs, or artifacts"
              />
            </div>
          </div>

          {selectedProject && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Project:</strong> {selectedProject.projectName}
                {selectedProject.clientName && (
                  <span className="ml-2">• <strong>Client:</strong> {selectedProject.clientName}</span>
                )}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <LoadingButton 
              type="submit" 
              className="w-full sm:w-auto"
              loadingText={isEditing ? "Updating..." : "Creating..."}
            >
              {isEditing ? 'Update Task' : 'Create Task'}
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}