import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Task Update API: Starting request...');
    
    const taskId = params.id;
    const taskData = await request.json();
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
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
      console.error('Task Update API: Missing spreadsheet ID');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete' },
        { status: 500 }
      );
    }

    console.log('Task Update API: Initializing data service...');
    const dataService = new DataService(spreadsheetId, credentials);
    
    console.log(`Task Update API: Updating task ${taskId}...`);
    const updatedTask = await dataService.updateTask(taskId, taskData);
    
    console.log('Task Update API: Task updated successfully');
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Task Update API: Error:', error);
    return NextResponse.json(
      { error: `Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}