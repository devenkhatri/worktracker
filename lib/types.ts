export interface Project {
  id: string;
  projectName: string;
  clientName: string;
  projectDescription: string;
  startDate: string;
  endDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  budget: number;
  perHourRate: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  totalBilledHours: number;
  totalAmount: number;
}

export interface Task {
  id: string;
  projectId: string;
  taskName: string;
  taskDescription: string;
  assignedTo: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  estimatedHours: number;
  actualHours: number;
  billedHours: number;
  projectPerHourRate: number;
  taskPerHourRate: number;
  calculatedAmount: number;
  dueDate: string;
  artifacts: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  description: string;
  userName: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalHoursLogged: number;
  totalRevenue: number;
  avgProjectCompletion: number;
}

export interface GoogleSheetsResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

export interface Activity {
  id: string;
  timestamp: string;
  type: 'project_created' | 'project_updated' | 'project_completed' | 'task_created' | 'task_updated' | 'task_completed' | 'time_logged' | 'project_status_changed' | 'task_status_changed';
  description: string;
  entityId: string; // ID of the project, task, or time entry
  entityName: string; // Name of the project or task
  userName: string;
  metadata?: string; // Additional context (JSON string)
}

export interface User {
  username: string;
  password: string;
  lastLogin?: string;
}

export interface AuthSession {
  username: string;
  isAuthenticated: boolean;
  loginTime: string;
}

export interface GoogleSheetsUpdateResponse {
  spreadsheetId: string;
  updatedCells: number;
  updatedColumns: number;
  updatedRows: number;
}