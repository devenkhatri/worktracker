import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Time Entry Update API: Starting request...');
    
    const timeEntryId = params.id;
    const timeEntryData = await request.json();
    
    if (!timeEntryId) {
      return NextResponse.json(
        { error: 'Time Entry ID is required' },
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
      console.error('Time Entry Update API: Missing spreadsheet ID');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete' },
        { status: 500 }
      );
    }

    console.log('Time Entry Update API: Initializing data service...');
    const dataService = new DataService(spreadsheetId, credentials);
    
    console.log(`Time Entry Update API: Updating time entry ${timeEntryId}...`);
    const updatedTimeEntry = await dataService.updateTimeEntry(timeEntryId, timeEntryData);
    
    console.log('Time Entry Update API: Time entry updated successfully');
    return NextResponse.json(updatedTimeEntry);
  } catch (error) {
    console.error('Time Entry Update API: Error:', error);
    return NextResponse.json(
      { error: `Failed to update time entry: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}