import { Project, Task, TimeEntry, DashboardStats, Activity, User } from './types';
import GoogleSheetsService from './google-sheets';

export class DataService {
  private sheetsService: GoogleSheetsService;

  constructor(spreadsheetId: string, credentials: { email?: string; privateKey?: string; apiKey?: string }) {
    try {
      this.sheetsService = new GoogleSheetsService(spreadsheetId, credentials);
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  async verifyConfiguration() {
    return await this.sheetsService.verifyConfiguration();
  }

  /**
   * Validates project data before saving
   */
  private validateProjectData(project: Omit<Project, 'id' | 'totalActualHours' | 'totalAmount'>): void {
    const errors: string[] = [];

    if (!project.projectName?.trim()) {
      errors.push('Project name is required');
    }

    if (!project.clientName?.trim()) {
      errors.push('Client name is required');
    }

    if (!project.startDate) {
      errors.push('Start date is required');
    }

    if (!project.endDate) {
      errors.push('End date is required');
    }

    if (project.startDate && project.endDate && new Date(project.startDate) > new Date(project.endDate)) {
      errors.push('End date must be after start date');
    }

    if (project.budget < 0) {
      errors.push('Budget cannot be negative');
    }

    if (project.perHourRate < 0) {
      errors.push('Per hour rate cannot be negative');
    }

    if (project.totalEstimatedHours < 0) {
      errors.push('Estimated hours cannot be negative');
    }

    if (project.totalBilledHours < 0) {
      errors.push('Billed hours cannot be negative');
    }

    if (errors.length > 0) {
      throw new Error(`Project validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Validates task data before saving
   */
  private validateTaskData(task: Omit<Task, 'id' | 'actualHours' | 'calculatedAmount'>): void {
    const errors: string[] = [];

    if (!task.projectId?.trim()) {
      errors.push('Project ID is required');
    }

    if (!task.taskName?.trim()) {
      errors.push('Task name is required');
    }

    if (!['High', 'Medium', 'Low'].includes(task.priority)) {
      errors.push('Priority must be High, Medium, or Low');
    }

    if (!['To Do', 'In Progress', 'Review', 'Completed'].includes(task.status)) {
      errors.push('Status must be To Do, In Progress, Review, or Completed');
    }

    if (task.estimatedHours < 0) {
      errors.push('Estimated hours cannot be negative');
    }

    if (task.billedHours < 0) {
      errors.push('Billed hours cannot be negative');
    }

    if (task.projectPerHourRate < 0) {
      errors.push('Project per hour rate cannot be negative');
    }

    if (task.taskPerHourRate < 0) {
      errors.push('Task per hour rate cannot be negative');
    }

    if (errors.length > 0) {
      throw new Error(`Task validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Validates time entry data before saving
   */
  private validateTimeEntryData(timeEntry: Omit<TimeEntry, 'id' | 'duration'>): void {
    const errors: string[] = [];

    if (!timeEntry.projectId?.trim()) {
      errors.push('Project ID is required');
    }

    if (!timeEntry.taskId?.trim()) {
      errors.push('Task ID is required');
    }

    if (!timeEntry.date) {
      errors.push('Date is required');
    }

    if (!timeEntry.startTime) {
      errors.push('Start time is required');
    }

    if (!timeEntry.endTime) {
      errors.push('End time is required');
    }

    if (!timeEntry.userName?.trim()) {
      errors.push('User name is required');
    }

    // Validate date format
    if (timeEntry.date && isNaN(new Date(timeEntry.date).getTime())) {
      errors.push('Invalid date format');
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeEntry.startTime && !timeRegex.test(timeEntry.startTime)) {
      errors.push('Invalid start time format (use HH:MM)');
    }

    if (timeEntry.endTime && !timeRegex.test(timeEntry.endTime)) {
      errors.push('Invalid end time format (use HH:MM)');
    }

    if (errors.length > 0) {
      throw new Error(`Time entry validation failed: ${errors.join(', ')}`);
    }
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    try {
      console.log('DataService: Fetching projects...');
      const response = await this.sheetsService.getSheetData('Projects!A2:M');
      console.log('DataService: Projects response:', response);
      if (!response.values) return [];

      return response.values.map((row: string[]) => ({
        id: row[0] || '',
        projectName: row[1] || '',
        clientName: row[2] || '',
        projectDescription: row[3] || '',
        startDate: row[4] || '',
        endDate: row[5] || '',
        status: (row[6] || 'Not Started') as Project['status'],
        budget: parseFloat(row[7]) || 0,
        perHourRate: parseFloat(row[8]) || 0,
        totalEstimatedHours: parseFloat(row[9]) || 0,
        totalActualHours: parseFloat(row[10]) || 0,
        totalBilledHours: parseFloat(row[11]) || 0,
        totalAmount: parseFloat(row[12]) || 0,
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);

        // Re-throw with more context
        if (error.message.includes('GOOGLE_SHEETS_SPREADSHEET_ID')) {
          throw new Error('Google Sheets not configured. Please set up your environment variables.');
        }
        if (error.message.includes('403')) {
          throw new Error('Access denied to Google Sheet. Please check your API key permissions and ensure the sheet is publicly accessible.');
        }
        if (error.message.includes('404')) {
          throw new Error('Google Sheet not found. Please verify your spreadsheet ID is correct.');
        }
      }
      throw error;
    }
  }

  async addProject(project: Omit<Project, 'id' | 'totalActualHours' | 'totalAmount'>): Promise<Project> {
    try {
      // Validate project data
      this.validateProjectData(project);

      const id = this.sheetsService.generateProjectId();
      const newProject: Project = {
        ...project,
        id,
        totalActualHours: 0,
        totalAmount: project.totalBilledHours * project.perHourRate,
      };

      console.log('DataService: Creating project with data:', newProject);

      const values = [[
        newProject.id,
        newProject.projectName,
        newProject.clientName,
        newProject.projectDescription,
        newProject.startDate,
        newProject.endDate,
        newProject.status,
        newProject.budget.toString(),
        newProject.perHourRate.toString(),
        newProject.totalEstimatedHours.toString(),
        newProject.totalActualHours.toString(),
        newProject.totalBilledHours.toString(),
        newProject.totalAmount.toString(),
      ]];

      console.log('DataService: Appending values to Projects sheet:', values);
      await this.sheetsService.appendSheetData('Projects!A:M', values);
      console.log('DataService: Project created successfully');

      // Log activity
      await this.logActivity(
        'project_created',
        `Project "${newProject.projectName}" created for client ${newProject.clientName}`,
        newProject.id,
        newProject.projectName,
        'System' // TODO: Pass actual username from session
      );

      return newProject;
    } catch (error) {
      console.error('DataService: Error creating project:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('insufficient authentication')) {
          throw new Error('Cannot create project: You need Service Account credentials to write data to Google Sheets. API keys only provide read access.');
        }
        if (error.message.includes('validation failed')) {
          throw error; // Re-throw validation errors as-is
        }
        if (error.message.includes('Sheet not found')) {
          throw new Error('Cannot create project: The "Projects" worksheet was not found in your Google Sheet.');
        }
      }

      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    try {
      const response = await this.sheetsService.getSheetData('Tasks!A2:R');
      if (!response.values) return [];

      return response.values.map((row: string[]) => ({
        id: row[0] || '',
        projectId: row[1] || '',
        taskName: row[2] || '',
        taskDescription: row[3] || '',
        assignedTo: row[4] || '',
        priority: (row[5] || 'Medium') as Task['priority'],
        status: (row[6] || 'To Do') as Task['status'],
        estimatedHours: parseFloat(row[7]) || 0,
        actualHours: parseFloat(row[8]) || 0,
        billedHours: parseFloat(row[9]) || 0,
        projectPerHourRate: parseFloat(row[10]) || 0,
        taskPerHourRate: parseFloat(row[11]) || 0,
        calculatedAmount: parseFloat(row[12]) || 0,
        dueDate: row[13] || '',
        artifacts: row[14] || '',
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (error instanceof Error && error.message.includes('GOOGLE_SHEETS_SPREADSHEET_ID')) {
        throw new Error('Google Sheets not configured. Please set up your environment variables.');
      }
      if (error instanceof Error && error.message.includes('403')) {
        throw new Error('Access denied to Google Sheet. Please check your API key permissions and ensure the sheet is publicly accessible.');
      }
      throw error;
    }
  }

  async addTask(task: Omit<Task, 'id' | 'actualHours' | 'calculatedAmount'>): Promise<Task> {
    try {
      // Validate task data
      this.validateTaskData(task);

      const id = this.sheetsService.generateTaskId();
      const newTask: Task = {
        ...task,
        id,
        actualHours: 0,
        calculatedAmount: task.billedHours * task.taskPerHourRate,
      };

      console.log('DataService: Creating task with data:', newTask);

      const values = [[
        newTask.id,
        newTask.projectId,
        newTask.taskName,
        newTask.taskDescription,
        newTask.assignedTo,
        newTask.priority,
        newTask.status,
        newTask.estimatedHours.toString(),
        newTask.actualHours.toString(),
        newTask.billedHours.toString(),
        newTask.projectPerHourRate.toString(),
        newTask.taskPerHourRate.toString(),
        newTask.calculatedAmount.toString(),
        newTask.dueDate,
        newTask.artifacts,
      ]];

      console.log('DataService: Appending values to Tasks sheet:', values);
      await this.sheetsService.appendSheetData('Tasks!A:R', values);
      console.log('DataService: Task created successfully');

      // Log activity
      await this.logActivity(
        'task_created',
        `Task "${newTask.taskName}" created and assigned to ${newTask.assignedTo || 'unassigned'}`,
        newTask.id,
        newTask.taskName,
        'System' // TODO: Pass actual username from session
      );

      return newTask;
    } catch (error) {
      console.error('DataService: Error creating task:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('insufficient authentication')) {
          throw new Error('Cannot create task: You need Service Account credentials to write data to Google Sheets. API keys only provide read access.');
        }
        if (error.message.includes('validation failed')) {
          throw error; // Re-throw validation errors as-is
        }
        if (error.message.includes('Sheet not found')) {
          throw new Error('Cannot create task: The "Tasks" worksheet was not found in your Google Sheet.');
        }
      }

      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Time Entry operations
  async getTimeEntries(): Promise<TimeEntry[]> {
    try {
      const response = await this.sheetsService.getSheetData('TimeEntries!A2:I');
      if (!response.values) return [];

      return response.values.map((row: string[]) => ({
        id: row[0] || '',
        projectId: row[1] || '',
        taskId: row[2] || '',
        date: row[3] || '',
        startTime: row[4] || '',
        endTime: row[5] || '',
        duration: parseFloat(row[6]) || 0,
        description: row[7] || '',
        userName: row[8] || '',
      }));
    } catch (error) {
      console.error('Error fetching time entries:', error);
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error('TimeEntries worksheet not found. Please ensure your Google Sheet has a worksheet named "TimeEntries" with the correct headers.');
      }
      if (error instanceof Error && error.message.includes('403')) {
        throw new Error('Access denied to Google Sheet. Please check your API key permissions and ensure the sheet is publicly accessible or shared with your service account.');
      }
      throw error;
    }
  }

  async addTimeEntry(timeEntry: Omit<TimeEntry, 'id' | 'duration'>): Promise<TimeEntry> {
    try {
      // Validate time entry data
      this.validateTimeEntryData(timeEntry);

      const id = this.sheetsService.generateTimeEntryId();
      const duration = this.sheetsService.calculateDuration(timeEntry.startTime, timeEntry.endTime);

      if (duration <= 0) {
        throw new Error('Invalid time range: End time must be after start time');
      }

      const newTimeEntry: TimeEntry = {
        ...timeEntry,
        id,
        duration,
      };

      console.log('DataService: Creating time entry with data:', newTimeEntry);

      const values = [[
        newTimeEntry.id,
        newTimeEntry.projectId,
        newTimeEntry.taskId,
        newTimeEntry.date,
        newTimeEntry.startTime,
        newTimeEntry.endTime,
        newTimeEntry.duration.toString(),
        newTimeEntry.description,
        newTimeEntry.userName,
      ]];

      console.log('DataService: Appending values to TimeEntries sheet:', values);
      await this.sheetsService.appendSheetData('TimeEntries!A:I', values);
      console.log('DataService: Time entry created successfully');

      // Log activity
      await this.logActivity(
        'time_logged',
        `${newTimeEntry.duration} hours logged for "${newTimeEntry.description || 'work session'}"`,
        newTimeEntry.id,
        newTimeEntry.description || 'Time Entry',
        newTimeEntry.userName
      );

      return newTimeEntry;
    } catch (error) {
      console.error('DataService: Error creating time entry:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('insufficient authentication')) {
          throw new Error('Cannot create time entry: You need Service Account credentials to write data to Google Sheets. API keys only provide read access.');
        }
        if (error.message.includes('validation failed')) {
          throw error; // Re-throw validation errors as-is
        }
        if (error.message.includes('Sheet not found')) {
          throw new Error('Cannot create time entry: The "TimeEntries" worksheet was not found in your Google Sheet.');
        }
      }

      throw new Error(`Failed to create time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Authentication methods
  async getUsers(): Promise<User[]> {
    try {
      console.log('DataService: Getting users...');
      const response = await this.sheetsService.getSheetData('Users!A2:C');

      if (!response.values || response.values.length === 0) {
        console.log('DataService: No users found');
        return [];
      }

      const users: User[] = response.values.map((row: string[]) => ({
        username: row[0] || '',
        password: row[1] || '',
        lastLogin: row[2] || ''
      }));

      console.log(`DataService: Found ${users.length} users`);
      return users;
    } catch (error) {
      console.error('DataService: Error getting users:', error);
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateCredentials(username: string, password: string): Promise<boolean> {
    try {
      console.log(`DataService: Validating credentials for user: ${username}`);
      const users = await this.getUsers();

      const user = users.find(u => u.username === username && u.password === password);
      const isValid = !!user;

      console.log(`DataService: Credentials validation result: ${isValid}`);
      return isValid;
    } catch (error) {
      console.error('DataService: Error validating credentials:', error);
      return false;
    }
  }

  async updateLastLogin(username: string): Promise<void> {
    try {
      console.log(`DataService: Updating last login for user: ${username}`);

      // Get all users to find the row number
      const response = await this.sheetsService.getSheetData('Users!A:C');

      if (!response.values || response.values.length === 0) {
        throw new Error('No users found in sheet');
      }

      // Find the user's row (starting from row 2, since row 1 is headers)
      let userRowIndex = -1;
      for (let i = 1; i < response.values.length; i++) {
        if (response.values[i][0] === username) {
          userRowIndex = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }

      if (userRowIndex === -1) {
        throw new Error(`User ${username} not found in Users sheet`);
      }

      // Update the last login timestamp in column C
      const currentDateTime = new Date().toISOString();
      const range = `Users!C${userRowIndex}`;

      console.log(`DataService: Updating range ${range} with timestamp: ${currentDateTime}`);

      await this.sheetsService.updateSheetData(range, [[currentDateTime]]);

      console.log(`DataService: Successfully updated last login for user: ${username}`);
    } catch (error) {
      console.error('DataService: Error updating last login:', error);
      // Don't throw error to prevent login from failing if last login update fails
      console.warn('Last login update failed, but continuing with login process');
    }
  }

  // Activity tracking
  async logActivity(
    type: Activity['type'],
    description: string,
    entityId: string,
    entityName: string,
    userName: string = 'System',
    metadata?: any
  ): Promise<void> {
    try {
      const id = this.sheetsService.generateActivityId();
      const timestamp = new Date().toISOString();

      const activity: Activity = {
        id,
        timestamp,
        type,
        description,
        entityId,
        entityName,
        userName,
        metadata: metadata ? JSON.stringify(metadata) : ''
      };

      const values = [[
        activity.id,
        activity.timestamp,
        activity.type,
        activity.description,
        activity.entityId,
        activity.entityName,
        activity.userName,
        activity.metadata || ''
      ]];

      await this.sheetsService.appendSheetData('Activities!A:H', values);
      console.log('Activity logged:', activity.description);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to prevent breaking main operations
    }
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    try {
      console.log('DataService: Getting recent activities...');
      const response = await this.sheetsService.getSheetData('Activities!A:H');

      if (!response.values || response.values.length <= 1) {
        console.log('DataService: No activities found');
        return [];
      }

      // Skip header row and convert to Activity objects
      const activities: Activity[] = response.values.slice(1).map((row: string[]) => ({
        id: row[0] || '',
        timestamp: row[1] || '',
        type: (row[2] || 'project_created') as Activity['type'],
        description: row[3] || '',
        entityId: row[4] || '',
        entityName: row[5] || '',
        userName: row[6] || 'System',
        metadata: row[7] || ''
      }));

      // Sort by timestamp (newest first) and limit results
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      console.log(`DataService: Found ${sortedActivities.length} recent activities`);
      return sortedActivities;
    } catch (error) {
      console.error('DataService: Error getting activities:', error);
      return []; // Return empty array instead of throwing to prevent dashboard from breaking
    }
  }

  async updateTaskStatus(taskId: string, newStatus: Task['status']): Promise<void> {
    try {
      console.log(`DataService: Updating task ${taskId} status to ${newStatus}`);
      
      // Get all tasks to find the row number
      const response = await this.sheetsService.getSheetData('Tasks!A:R');
      
      if (!response.values || response.values.length === 0) {
        throw new Error('No tasks found in sheet');
      }

      // Find the task's row (starting from row 2, since row 1 is headers)
      let taskRowIndex = -1;
      for (let i = 1; i < response.values.length; i++) {
        if (response.values[i][0] === taskId) {
          taskRowIndex = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }

      if (taskRowIndex === -1) {
        throw new Error(`Task ${taskId} not found in Tasks sheet`);
      }

      // Update the status in column G (7th column)
      const range = `Tasks!G${taskRowIndex}`;
      
      console.log(`DataService: Updating range ${range} with status: ${newStatus}`);
      
      await this.sheetsService.updateSheetData(range, [[newStatus]]);
      
      // Log activity for status change
      await this.logActivity(
        'task_status_changed',
        `Task status changed to "${newStatus}"`,
        taskId,
        `Task ${taskId}`,
        'System' // TODO: Pass actual username from session
      );
      
      console.log(`DataService: Successfully updated task ${taskId} status to ${newStatus}`);
    } catch (error) {
      console.error('DataService: Error updating task status:', error);
      throw new Error(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProject(projectId: string, updatedProject: Omit<Project, 'id' | 'totalActualHours' | 'totalAmount'>): Promise<Project> {
    try {
      console.log(`DataService: Updating project ${projectId}`);
      
      // Validate project data
      this.validateProjectData(updatedProject);
      
      // Get all projects to find the row number
      const response = await this.sheetsService.getSheetData('Projects!A:M');
      
      if (!response.values || response.values.length === 0) {
        throw new Error('No projects found in sheet');
      }

      // Find the project's row
      let projectRowIndex = -1;
      for (let i = 1; i < response.values.length; i++) {
        if (response.values[i][0] === projectId) {
          projectRowIndex = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }

      if (projectRowIndex === -1) {
        throw new Error(`Project ${projectId} not found in Projects sheet`);
      }

      // Calculate total amount
      const totalAmount = updatedProject.totalBilledHours * updatedProject.perHourRate;

      // Update the entire row
      const values = [[
        projectId, // Keep the same ID
        updatedProject.projectName,
        updatedProject.clientName,
        updatedProject.projectDescription,
        updatedProject.startDate,
        updatedProject.endDate,
        updatedProject.status,
        updatedProject.budget.toString(),
        updatedProject.perHourRate.toString(),
        updatedProject.totalEstimatedHours.toString(),
        updatedProject.totalActualHours.toString(), // Keep existing actual hours
        updatedProject.totalBilledHours.toString(),
        totalAmount.toString(),
      ]];

      const range = `Projects!A${projectRowIndex}:M${projectRowIndex}`;
      await this.sheetsService.updateSheetData(range, values);

      // Log activity
      await this.logActivity(
        'project_updated',
        `Project "${updatedProject.projectName}" updated`,
        projectId,
        updatedProject.projectName,
        'System'
      );

      const updatedProjectData: Project = {
        ...updatedProject,
        id: projectId,
        totalActualHours: updatedProject.totalActualHours,
        totalAmount: totalAmount
      };

      console.log(`DataService: Successfully updated project ${projectId}`);
      return updatedProjectData;
    } catch (error) {
      console.error('DataService: Error updating project:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTask(taskId: string, updatedTask: Omit<Task, 'id' | 'actualHours' | 'calculatedAmount'>): Promise<Task> {
    try {
      console.log(`DataService: Updating task ${taskId}`);
      
      // Validate task data
      this.validateTaskData(updatedTask);
      
      // Get all tasks to find the row number
      const response = await this.sheetsService.getSheetData('Tasks!A:R');
      
      if (!response.values || response.values.length === 0) {
        throw new Error('No tasks found in sheet');
      }

      // Find the task's row
      let taskRowIndex = -1;
      for (let i = 1; i < response.values.length; i++) {
        if (response.values[i][0] === taskId) {
          taskRowIndex = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }

      if (taskRowIndex === -1) {
        throw new Error(`Task ${taskId} not found in Tasks sheet`);
      }

      // Calculate amount
      const calculatedAmount = updatedTask.billedHours * updatedTask.taskPerHourRate;

      // Update the entire row
      const values = [[
        taskId, // Keep the same ID
        updatedTask.projectId,
        updatedTask.taskName,
        updatedTask.taskDescription,
        updatedTask.assignedTo,
        updatedTask.priority,
        updatedTask.status,
        updatedTask.estimatedHours.toString(),
        updatedTask.actualHours.toString(), // Keep existing actual hours
        updatedTask.billedHours.toString(),
        updatedTask.projectPerHourRate.toString(),
        updatedTask.taskPerHourRate.toString(),
        calculatedAmount.toString(),
        updatedTask.dueDate,
        updatedTask.artifacts,
      ]];

      const range = `Tasks!A${taskRowIndex}:R${taskRowIndex}`;
      await this.sheetsService.updateSheetData(range, values);

      // Log activity
      await this.logActivity(
        'task_updated',
        `Task "${updatedTask.taskName}" updated`,
        taskId,
        updatedTask.taskName,
        'System'
      );

      const updatedTaskData: Task = {
        ...updatedTask,
        id: taskId,
        actualHours: updatedTask.actualHours,
        calculatedAmount: calculatedAmount
      };

      console.log(`DataService: Successfully updated task ${taskId}`);
      return updatedTaskData;
    } catch (error) {
      console.error('DataService: Error updating task:', error);
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTimeEntry(timeEntryId: string, updatedTimeEntry: Omit<TimeEntry, 'id' | 'duration'>): Promise<TimeEntry> {
    try {
      console.log(`DataService: Updating time entry ${timeEntryId}`);
      
      // Validate time entry data
      this.validateTimeEntryData(updatedTimeEntry);
      
      // Get all time entries to find the row number
      const response = await this.sheetsService.getSheetData('TimeEntries!A:I');
      
      if (!response.values || response.values.length === 0) {
        throw new Error('No time entries found in sheet');
      }

      // Find the time entry's row
      let timeEntryRowIndex = -1;
      for (let i = 1; i < response.values.length; i++) {
        if (response.values[i][0] === timeEntryId) {
          timeEntryRowIndex = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }

      if (timeEntryRowIndex === -1) {
        throw new Error(`Time entry ${timeEntryId} not found in TimeEntries sheet`);
      }

      // Calculate duration
      const duration = this.sheetsService.calculateDuration(updatedTimeEntry.startTime, updatedTimeEntry.endTime);

      // Update the entire row
      const values = [[
        timeEntryId, // Keep the same ID
        updatedTimeEntry.projectId,
        updatedTimeEntry.taskId,
        updatedTimeEntry.date,
        updatedTimeEntry.startTime,
        updatedTimeEntry.endTime,
        duration.toString(),
        updatedTimeEntry.description,
        updatedTimeEntry.userName,
      ]];

      const range = `TimeEntries!A${timeEntryRowIndex}:I${timeEntryRowIndex}`;
      await this.sheetsService.updateSheetData(range, values);

      // Log activity
      await this.logActivity(
        'time_logged',
        `Time entry updated: ${duration} hours`,
        timeEntryId,
        updatedTimeEntry.description || 'Time Entry',
        updatedTimeEntry.userName
      );

      const updatedTimeEntryData: TimeEntry = {
        ...updatedTimeEntry,
        id: timeEntryId,
        duration: duration
      };

      console.log(`DataService: Successfully updated time entry ${timeEntryId}`);
      return updatedTimeEntryData;
    } catch (error) {
      console.error('DataService: Error updating time entry:', error);
      throw new Error(`Failed to update time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    console.log('DataService: Getting dashboard stats...');
    const [projects, tasks, timeEntries] = await Promise.all([
      this.getProjects(),
      this.getTasks(),
      this.getTimeEntries(),
    ]);

    console.log('DataService: Raw data counts:', {
      projects: projects.length,
      tasks: tasks.length,
      timeEntries: timeEntries.length
    });

    const activeProjects = projects.filter(p => p.status === 'In Progress').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalHoursLogged = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalRevenue = projects.reduce((sum, project) => sum + project.totalAmount, 0);
    const avgProjectCompletion = projects.length > 0 ? (completedProjects / projects.length) * 100 : 0;

    const stats = {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      totalTasks: tasks.length,
      completedTasks,
      totalHoursLogged,
      totalRevenue,
      avgProjectCompletion,
    };

    console.log('DataService: Calculated stats:', stats);
    return stats;
  }

  // Data relationships
  async getTasksForProject(projectId: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks.filter(task => task.projectId === projectId);
  }

  async getTimeEntriesForTask(taskId: string): Promise<TimeEntry[]> {
    const timeEntries = await this.getTimeEntries();
    return timeEntries.filter(entry => entry.taskId === taskId);
  }

  async updateTaskActualHours(taskId: string): Promise<void> {
    const timeEntries = await this.getTimeEntriesForTask(taskId);
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);

    // Update the task's actual hours in the sheet
    // This would require finding the row and updating it
    // Implementation depends on your specific needs
  }
}

export default DataService;