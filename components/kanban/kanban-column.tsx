"use client";

import { Task } from '@/lib/types';
import { KanbanCard } from './kanban-card';
import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: {
    id: Task['status'];
    title: string;
    color: string;
  };
  tasks: Task[];
  isDragging: boolean;
  onTaskOpen?: (task: Task) => void;
}

export function KanbanColumn({ column, tasks, isDragging, onTaskOpen }: KanbanColumnProps) {
  return (
    <div className={cn(
      "flex flex-col rounded-lg border-2 border-dashed transition-colors",
      column.color,
      isDragging && "border-opacity-50"
    )}>
      {/* Column Header */}
      <div className="p-4 border-b border-current border-opacity-20">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{column.title}</h3>
          <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 p-4 space-y-3 min-h-[200px] transition-colors",
              snapshot.isDraggedOver && "bg-opacity-50"
            )}
          >
            {tasks.map((task, index) => (
              <KanbanCard
                key={task.id}
                task={task}
                index={index}
                onTaskOpen={onTaskOpen}
              />
            ))}
            {provided.placeholder}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No tasks</p>
                <p className="text-xs">Drag tasks here</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}