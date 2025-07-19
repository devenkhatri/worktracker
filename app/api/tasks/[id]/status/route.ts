import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Task Status API: Starting request...');
    
    const taskId = params.id;
    const { status } = await request.json();
    
    if (!taskId || !status) {
      return NextResponse.json(
        { error: 'Task ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['To Do', 'In Progress', 'Review', 'Completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const credentials = {
      email: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      apiKey: process.env.GOOGLE_SHEETS_API_KEY,
    };

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('Task Status API: Missing spreadsheet ID');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete' },
        { status: 500 }
      );
    }

    console.log('Task Status API: Initializing data service...');
    const dataService = new DataService(spreadsheetId, credentials);
    
    console.log(`Task Status API: Updating task ${taskId} status to ${status}...`);
    await dataService.updateTaskStatus(taskId, status);
    
    console.log('Task Status API: Task status updated successfully');
    return NextResponse.json({
      success: true,
      message: 'Task status updated successfully',
      taskId,
      newStatus: status
    });
  } catch (error) {
    console.error('Task Status API: Error:', error);
    return NextResponse.json(
      { error: `Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}