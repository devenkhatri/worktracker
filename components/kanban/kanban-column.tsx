"use client";

import React from 'react';
import { Task } from '@/lib/types';
import { KanbanCard } from './kanban-card';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: {
    id: Task['status'];
    title: string;
    color: string;
  };
  tasks: Task[];
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onDrop: (status: Task['status']) => void;
  onTaskOpen?: (task: Task) => void;
  isDraggedOver: boolean;
}

export function KanbanColumn({ 
  column, 
  tasks, 
  onDragStart, 
  onDragEnd, 
  onDrop,
  onTaskOpen,
  isDraggedOver 
}: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(column.id);
  };

  return (
    <div 
      className={cn(
        "flex flex-col rounded-lg border-2 border-dashed transition-colors",
        column.color,
        isDraggedOver && "border-opacity-50"
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-current border-opacity-20">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{column.title}</h3>
          <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks Area */}
      <div className="flex-1 p-4 space-y-3 min-h-[200px]">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTaskOpen={onTaskOpen}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No tasks</p>
            <p className="text-xs">Drag tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}