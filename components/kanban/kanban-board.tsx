"use client";

import { useState } from 'react';
import { Task } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskStatusUpdate: (taskId: string, newStatus: Task['status']) => void;
}

const COLUMNS: { id: Task['status']; title: string; color: string }[] = [
  { id: 'To Do', title: 'To Do', color: 'bg-gray-100 border-gray-200' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-blue-100 border-blue-200' },
  { id: 'Review', title: 'Review', color: 'bg-yellow-100 border-yellow-200' },
  { id: 'Completed', title: 'Completed', color: 'bg-green-100 border-green-200' },
];

export function KanbanBoard({ tasks, onTaskStatusUpdate }: KanbanBoardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update task status
    const newStatus = destination.droppableId as Task['status'];
    onTaskStatusUpdate(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            isDragging={isDragging}
          />
        ))}
      </div>
    </DragDropContext>
  );
}