"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task, Project } from '@/lib/types';
import { 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Minus,
  Edit,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task | null;
  project?: Project;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
}

export function TaskDetailModal({ task, project, isOpen, onClose, onEdit }: TaskDetailModalProps) {
  if (!task) return null;

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'High':
        return <AlertCircle className="h-4 w-4" />;
      case 'Medium':
        return <Minus className="h-4 w-4" />;
      case 'Low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const progressPercentage = task.estimatedHours > 0 
    ? Math.min((task.actualHours / task.estimatedHours) * 100, 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold pr-8">
              {task.taskName}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(task)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center space-x-4">
            <Badge className={cn("text-sm", getStatusColor(task.status))}>
              {task.status}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn("text-sm", getPriorityColor(task.priority))}
            >
              {getPriorityIcon(task.priority)}
              <span className="ml-1">{task.priority} Priority</span>
            </Badge>
          </div>

          {/* Project Info */}
          {project && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Project</h3>
              <p className="font-semibold">{project.projectName}</p>
              <p className="text-sm text-muted-foreground">{project.clientName}</p>
            </div>
          )}

          {/* Description */}
          {task.taskDescription && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Description</h3>
              <p className="text-sm leading-relaxed">{task.taskDescription}</p>
            </div>
          )}

          {/* Assignment and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Assigned To</h3>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{task.assignedTo || 'Unassigned'}</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Due Date</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDate(task.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3">Time Tracking</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold">{task.estimatedHours}h</div>
                  <div className="text-xs text-muted-foreground">Estimated</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold">{task.actualHours}h</div>
                  <div className="text-xs text-muted-foreground">Actual</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">{formatCurrency(task.projectPerHourRate)}</div>
              <div className="text-xs text-muted-foreground">Project Rate</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">{formatCurrency(task.taskPerHourRate)}</div>
              <div className="text-xs text-muted-foreground">Task Rate</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-green-600">{formatCurrency(task.calculatedAmount)}</div>
              <div className="text-xs text-muted-foreground">Total Amount</div>
            </div>
          </div>

          {/* Artifacts */}
          {task.artifacts && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Artifacts & Deliverables</h3>
              <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-lg">{task.artifacts}</p>
            </div>
          )}

          {/* Task ID */}
          <div className="text-xs text-muted-foreground border-t pt-4">
            Task ID: {task.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}