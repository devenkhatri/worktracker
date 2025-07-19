"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, Project } from '@/lib/types';

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'actualHours' | 'calculatedAmount'>) => void;
  onCancel: () => void;
  projects: Project[];
  initialData?: Partial<Task>;
  isEditing?: boolean;
}

export function TaskForm({ onSubmit, onCancel, projects, initialData, isEditing = false }: TaskFormProps) {
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || '',
    taskName: initialData?.taskName || '',
    taskDescription: initialData?.taskDescription || '',
    assignedTo: initialData?.assignedTo || '',
    priority: initialData?.priority || 'Medium' as Task['priority'],
    status: initialData?.status || 'To Do' as Task['status'],
    estimatedHours: initialData?.estimatedHours || 0,
    billedHours: initialData?.billedHours || 0,
    projectPerHourRate: initialData?.projectPerHourRate || 0,
    taskPerHourRate: initialData?.taskPerHourRate || 0,
    dueDate: initialData?.dueDate || '',
    artifacts: initialData?.artifacts || '',
  });

  useEffect(() => {
    if (formData.projectId) {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      if (selectedProject) {
        setFormData(prev => ({
          ...prev,
          projectPerHourRate: selectedProject.perHourRate,
          taskPerHourRate: prev.taskPerHourRate || selectedProject.perHourRate,
        }));
      }
    }
  }, [formData.projectId, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="billedHours">Billed Hours</Label>
              <Input
                id="billedHours"
                type="number"
                value={formData.billedHours}
                onChange={(e) => handleInputChange('billedHours', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <Label htmlFor="taskPerHourRate">Task Rate (₹)</Label>
              <Input
                id="taskPerHourRate"
                type="number"
                value={formData.taskPerHourRate}
                onChange={(e) => handleInputChange('taskPerHourRate', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="artifacts">Artifacts/Deliverables</Label>
            <Textarea
              id="artifacts"
              value={formData.artifacts}
              onChange={(e) => handleInputChange('artifacts', e.target.value)}
              rows={2}
              placeholder="Describe deliverables, outputs, or artifacts..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}