import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function GET() {
  try {
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required.' },
        { status: 500 }
      );
    }

    // Prepare credentials based on available environment variables
    const credentials: { email?: string; privateKey?: string; apiKey?: string } = {};
    
    if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      credentials.email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
      credentials.privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    } else if (process.env.GOOGLE_SHEETS_API_KEY) {
      credentials.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    } else {
      return NextResponse.json(
        { error: 'Either Service Account credentials or API key must be provided.' },
        { status: 500 }
      );
    }

    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );
    
    const tasks = await dataService.getTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required.' },
        { status: 500 }
      );
    }

    // Service Account required for write operations
    if (!process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Service Account credentials (GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL + GOOGLE_SHEETS_PRIVATE_KEY) are required for creating tasks.' },
        { status: 500 }
      );
    }

    const credentials = {
      email: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY
    };

    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );
    
    const body = await request.json();
    const task = await dataService.addTask(body);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}