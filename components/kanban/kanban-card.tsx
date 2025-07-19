"use client";

import { Task } from '@/lib/types';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Minus
} from 'lucide-react';

interface KanbanCardProps {
  task: Task;
  index: number;
  onTaskOpen?: (task: Task) => void;
}

export function KanbanCard({ task, index, onTaskOpen }: KanbanCardProps) {
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
        return <AlertCircle className="h-3 w-3" />;
      case 'Medium':
        return <Minus className="h-3 w-3" />;
      case 'Low':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const handleDoubleClick = () => {
    if (onTaskOpen) {
      onTaskOpen(task);
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md",
            snapshot.isDragging && "shadow-lg rotate-2 scale-105"
          )}
          title="Double-click to view details"
        >
          <CardContent className="p-4 space-y-3">
            {/* Task Title */}
            <div>
              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                {task.taskName}
              </h4>
              {task.taskDescription && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {task.taskDescription}
                </p>
              )}
            </div>

            {/* Priority Badge */}
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs", getPriorityColor(task.priority))}
              >
                {getPriorityIcon(task.priority)}
                <span className="ml-1">{task.priority}</span>
              </Badge>
            </div>

            {/* Task Details */}
            <div className="space-y-2 text-xs text-muted-foreground">
              {/* Assigned To */}
              {task.assignedTo && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span className="truncate">{task.assignedTo}</span>
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              )}

              {/* Hours */}
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{task.actualHours}h / {task.estimatedHours}h</span>
              </div>

              {/* Amount */}
              {task.calculatedAmount > 0 && (
                <div className="text-xs font-medium text-green-600">
                  {formatCurrency(task.calculatedAmount)}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {task.estimatedHours > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%` 
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}