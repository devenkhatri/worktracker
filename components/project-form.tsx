"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/lib/types';

interface ProjectFormProps {
  onSubmit: (project: Omit<Project, 'id' | 'totalActualHours' | 'totalAmount'>) => void;
  onCancel: () => void;
  initialData?: Partial<Project>;
  isEditing?: boolean;
}

export function ProjectForm({ onSubmit, onCancel, initialData, isEditing = false }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    projectName: initialData?.projectName || '',
    clientName: initialData?.clientName || '',
    projectDescription: initialData?.projectDescription || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    status: initialData?.status || 'Not Started' as Project['status'],
    budget: initialData?.budget || 0,
    perHourRate: initialData?.perHourRate || 0,
    totalEstimatedHours: initialData?.totalEstimatedHours || 0,
    totalBilledHours: initialData?.totalBilledHours || 0,
  });

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
        <CardTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="projectDescription">Project Description</Label>
            <Textarea
              id="projectDescription"
              value={formData.projectDescription}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="perHourRate">Per Hour Rate (₹)</Label>
              <Input
                id="perHourRate"
                type="number"
                value={formData.perHourRate}
                onChange={(e) => handleInputChange('perHourRate', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="totalEstimatedHours">Estimated Hours</Label>
              <Input
                id="totalEstimatedHours"
                type="number"
                value={formData.totalEstimatedHours}
                onChange={(e) => handleInputChange('totalEstimatedHours', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="totalBilledHours">Billed Hours</Label>
            <Input
              id="totalBilledHours"
              type="number"
              value={formData.totalBilledHours}
              onChange={(e) => handleInputChange('totalBilledHours', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.5"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}