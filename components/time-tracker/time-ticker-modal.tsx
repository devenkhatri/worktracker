"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Project, Task } from '@/lib/types';
import {
    Play,
    Pause,
    Square,
    Clock,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeTickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    tasks: Task[];
    onTimeEntryCreated?: () => void;
}

interface TickerState {
    isRunning: boolean;
    isPaused: boolean;
    startTime: Date | null;
    pausedTime: number; // Total paused time in milliseconds
    elapsedTime: number; // Current elapsed time in milliseconds
}

export function TimeTickerModal({ isOpen, onClose, projects, tasks, onTimeEntryCreated }: TimeTickerModalProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [tickerState, setTickerState] = useState<TickerState>({
        isRunning: false,
        isPaused: false,
        startTime: null,
        pausedTime: 0,
        elapsedTime: 0
    });
    const [isLogging, setIsLogging] = useState(false);
    const [logSuccess, setLogSuccess] = useState(false);
    const [logError, setLogError] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pauseStartRef = useRef<Date | null>(null);

    // Filter tasks based on selected project
    const filteredTasks = tasks.filter(task => task.projectId === selectedProjectId);
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const selectedTask = tasks.find(t => t.id === selectedTaskId);

    // Update elapsed time every second when running
    useEffect(() => {
        if (tickerState.isRunning && !tickerState.isPaused && tickerState.startTime) {
            intervalRef.current = setInterval(() => {
                const now = new Date();
                const elapsed = now.getTime() - tickerState.startTime!.getTime() - tickerState.pausedTime;
                setTickerState(prev => ({ ...prev, elapsedTime: elapsed }));
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [tickerState.isRunning, tickerState.isPaused, tickerState.startTime, tickerState.pausedTime]);

    // Format elapsed time as HH:MM:SS
    const formatElapsedTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Convert milliseconds to hours (rounded to nearest minute)
    const millisecondsToHours = (milliseconds: number) => {
        const totalMinutes = Math.round(milliseconds / (1000 * 60));
        return totalMinutes / 60;
    };

    const handleStart = () => {
        if (!selectedProjectId || !selectedTaskId) {
            return;
        }

        const now = new Date();
        setTickerState({
            isRunning: true,
            isPaused: false,
            startTime: now,
            pausedTime: 0,
            elapsedTime: 0
        });
        setLogSuccess(false);
        setLogError(null);
    };

    const handlePause = () => {
        if (tickerState.isRunning && !tickerState.isPaused) {
            pauseStartRef.current = new Date();
            setTickerState(prev => ({ ...prev, isPaused: true }));
        }
    };

    const handleResume = () => {
        if (tickerState.isRunning && tickerState.isPaused && pauseStartRef.current) {
            const pauseDuration = new Date().getTime() - pauseStartRef.current.getTime();
            setTickerState(prev => ({
                ...prev,
                isPaused: false,
                pausedTime: prev.pausedTime + pauseDuration
            }));
            pauseStartRef.current = null;
        }
    };

    const handleStop = async () => {
        if (!tickerState.isRunning || !tickerState.startTime) {
            return;
        }

        setIsLogging(true);

        try {
            // Calculate final elapsed time
            let finalElapsedTime = tickerState.elapsedTime;
            if (tickerState.isPaused && pauseStartRef.current) {
                // If currently paused, use the last known elapsed time
                finalElapsedTime = tickerState.elapsedTime;
            } else if (!tickerState.isPaused) {
                // If currently running, calculate current elapsed time
                const now = new Date();
                finalElapsedTime = now.getTime() - tickerState.startTime.getTime() - tickerState.pausedTime;
            }

            console.log('Final elapsed time (ms):', finalElapsedTime);
            console.log('Start time:', tickerState.startTime);
            console.log('Paused time (ms):', tickerState.pausedTime);

            const durationHours = millisecondsToHours(finalElapsedTime);
            const startTime = tickerState.startTime.toTimeString().slice(0, 5); // HH:MM format
            const endTime = new Date().toTimeString().slice(0, 5); // HH:MM format
            const date = tickerState.startTime.toISOString().split('T')[0]; // YYYY-MM-DD format

            console.log('Duration hours:', durationHours);
            console.log('Time entry data:', { date, startTime, endTime });

            // Check if we have a meaningful duration (at least 1 minute)
            if (finalElapsedTime < 60000) { // Less than 1 minute
                throw new Error('Please track at least 1 minute of time');
            }

            // Create time entry
            const timeEntry = {
                projectId: selectedProjectId,
                taskId: selectedTaskId,
                date,
                startTime,
                endTime,
                description: description.trim() || 'Time tracked via ticker',
                userName: 'System User' // TODO: Get from auth context
            };

            console.log('Sending time entry:', timeEntry);

            const response = await fetch('/api/time-entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(timeEntry),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error(`Failed to log time entry: ${errorText}`);
            }

            const result = await response.json();
            console.log('Time entry logged successfully:', result);

            setLogSuccess(true);

            // Call the callback to refresh data
            if (onTimeEntryCreated) {
                onTimeEntryCreated();
            }

            // Reset ticker state
            setTickerState({
                isRunning: false,
                isPaused: false,
                startTime: null,
                pausedTime: 0,
                elapsedTime: 0
            });

            // Auto-close after success
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (error) {
            console.error('Error logging time entry:', error);
            setLogError(error instanceof Error ? error.message : 'Failed to log time entry');
        } finally {
            setIsLogging(false);
        }
    };

    const handleClose = () => {
        // Reset all state when closing
        setSelectedProjectId('');
        setSelectedTaskId('');
        setDescription('');
        setTickerState({
            isRunning: false,
            isPaused: false,
            startTime: null,
            pausedTime: 0,
            elapsedTime: 0
        });
        setLogSuccess(false);
        setLogError(null);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        onClose();
    };

    const canStart = selectedProjectId && selectedTaskId && !tickerState.isRunning;
    const canPause = tickerState.isRunning && !tickerState.isPaused;
    const canResume = tickerState.isRunning && tickerState.isPaused;
    const canStop = tickerState.isRunning;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Time Tracker</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Time Display */}
                    <div className="text-center">
                        <div className={cn(
                            "text-4xl font-mono font-bold transition-colors",
                            tickerState.isRunning ? "text-green-600" : "text-gray-400"
                        )}>
                            {formatElapsedTime(tickerState.elapsedTime)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            {tickerState.isRunning ? (
                                tickerState.isPaused ? "Paused" : "Running"
                            ) : (
                                "Ready to start"
                            )}
                        </div>
                    </div>

                    {/* Project Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="project">Project</Label>
                        <Select
                            value={selectedProjectId}
                            onValueChange={setSelectedProjectId}
                            disabled={tickerState.isRunning}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
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

                    {/* Task Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="task">Task</Label>
                        <Select
                            value={selectedTaskId}
                            onValueChange={setSelectedTaskId}
                            disabled={!selectedProjectId || tickerState.isRunning}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a task" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredTasks.map((task) => (
                                    <SelectItem key={task.id} value={task.id}>
                                        {task.taskName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What are you working on?"
                            rows={2}
                            disabled={tickerState.isRunning}
                        />
                    </div>

                    {/* Selected Task Info */}
                    {selectedTask && (
                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <div className="font-medium">{selectedTask.taskName}</div>
                            <div className="text-muted-foreground">
                                {selectedProject?.projectName} • Priority: {selectedTask.priority}
                            </div>
                        </div>
                    )}

                    {/* Control Buttons */}
                    <div className="flex justify-center space-x-2">
                        {!tickerState.isRunning && (
                            <Button
                                onClick={handleStart}
                                disabled={!canStart}
                                className="flex items-center space-x-2"
                            >
                                <Play className="h-4 w-4" />
                                <span>Start</span>
                            </Button>
                        )}

                        {canPause && (
                            <Button
                                onClick={handlePause}
                                variant="outline"
                                className="flex items-center space-x-2"
                            >
                                <Pause className="h-4 w-4" />
                                <span>Pause</span>
                            </Button>
                        )}

                        {canResume && (
                            <Button
                                onClick={handleResume}
                                variant="outline"
                                className="flex items-center space-x-2"
                            >
                                <Play className="h-4 w-4" />
                                <span>Resume</span>
                            </Button>
                        )}

                        {canStop && (
                            <Button
                                onClick={handleStop}
                                disabled={isLogging}
                                variant="destructive"
                                className="flex items-center space-x-2"
                            >
                                {isLogging ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Square className="h-4 w-4" />
                                )}
                                <span>{isLogging ? 'Logging...' : 'Stop'}</span>
                            </Button>
                        )}
                    </div>

                    {/* Success Message */}
                    {logSuccess && (
                        <div className="flex items-center justify-center space-x-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Time logged successfully!</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {logError && (
                        <div className="flex items-center justify-center space-x-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{logError}</span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}