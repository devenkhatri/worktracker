"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Expense, Project, Client } from '@/lib/types';

interface ExpenseFormProps {
  onSubmit: (expense: Omit<Expense, 'id' | 'submittedDate'>) => void;
  onCancel: () => void;
  projects: Project[];
  clients: Client[];
  initialData?: Partial<Expense>;
  isEditing?: boolean;
}

export function ExpenseForm({ onSubmit, onCancel, projects, clients, initialData, isEditing = false }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || '',
    clientId: initialData?.clientId || '',
    expenseDate: initialData?.expenseDate || new Date().toISOString().split('T')[0],
    category: initialData?.category || 'Other' as Expense['category'],
    description: initialData?.description || '',
    amount: initialData?.amount || 0,
    receiptUrl: initialData?.receiptUrl || '',
    billable: initialData?.billable || false,
    reimbursable: initialData?.reimbursable || false,
    status: initialData?.status || 'Pending' as Expense['status'],
    submittedBy: initialData?.submittedBy || 'System User', // TODO: Get from auth context
    approvedBy: initialData?.approvedBy || '',
    approvedDate: initialData?.approvedDate || '',
    notes: initialData?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
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
              <Label htmlFor="clientId">Client</Label>
              <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expenseDate">Expense Date</Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => handleInputChange('expenseDate', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Materials">Materials</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
              placeholder="Describe the expense..."
              required
            />
          </div>

          <div>
            <Label htmlFor="receiptUrl">Receipt URL (Optional)</Label>
            <Input
              id="receiptUrl"
              type="url"
              value={formData.receiptUrl}
              onChange={(e) => handleInputChange('receiptUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="billable"
                checked={formData.billable}
                onCheckedChange={(checked) => handleInputChange('billable', checked)}
              />
              <Label htmlFor="billable">Billable to Client</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reimbursable"
                checked={formData.reimbursable}
                onCheckedChange={(checked) => handleInputChange('reimbursable', checked)}
              />
              <Label htmlFor="reimbursable">Reimbursable</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {isEditing ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}