"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { TimeTickerModal } from './time-ticker-modal';
import { Project, Task } from '@/lib/types';
import { Loader2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingTickerButton() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedData = useRef(false);

  // Don't show on login page or if not authenticated
  if (pathname === '/login' || !isAuthenticated) {
    return null;
  }

  // Fetch projects and tasks when modal opens
  useEffect(() => {
    if (isModalOpen && !hasFetchedData.current) {
      fetchData();
    }
  }, [isModalOpen]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks')
      ]);

      if (!projectsResponse.ok || !tasksResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const projectsData = await projectsResponse.json();
      const tasksData = await tasksResponse.json();

      setProjects(projectsData);
      setTasks(tasksData);
      hasFetchedData.current = true;
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleTimeEntryCreated = () => {
    // Refresh the data after a time entry is created
    hasFetchedData.current = false;
    fetchData();
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={handleOpenModal}
        size="lg"
        title="Start Time Tracker"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
          "hover:bg-green-700 text-white"
        )}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        ) : (
          <div className='flex'><Timer className="h-4 w-4" />&nbsp;<span>Start</span></div>
        )}
      </Button>

      {/* Modal */}
      <TimeTickerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        projects={projects}
        tasks={tasks}
        onTimeEntryCreated={handleTimeEntryCreated}
      />
    </>
  );
}