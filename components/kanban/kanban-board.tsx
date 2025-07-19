"use client";

import { useState } from 'react';
import { Task } from '@/lib/types';
import { KanbanColumn } from './kanban-column';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskStatusUpdate: (taskId: string, newStatus: Task['status']) => void;
  onTaskOpen?: (task: Task) => void;
}

const COLUMNS: { id: Task['status']; title: string; color: string }[] = [
  { id: 'To Do', title: 'To Do', color: 'bg-gray-100 border-gray-200' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-blue-100 border-blue-200' },
  { id: 'Review', title: 'Review', color: 'bg-yellow-100 border-yellow-200' },
  { id: 'Completed', title: 'Completed', color: 'bg-green-100 border-green-200' },
];

export function KanbanBoard({ tasks, onTaskStatusUpdate, onTaskOpen }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (newStatus: Task['status']) => {
    if (draggedTask && draggedTask.status !== newStatus) {
      onTaskStatusUpdate(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {COLUMNS.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          tasks={getTasksByStatus(column.id)}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onTaskOpen={onTaskOpen}
          isDraggedOver={draggedTask?.status !== column.id}
        />
      ))}
    </div>
  );
}