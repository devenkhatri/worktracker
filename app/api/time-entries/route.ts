import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    console.log('Time Entries API: Starting GET request...');
    
    const credentials = {
      email: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      apiKey: process.env.GOOGLE_SHEETS_API_KEY,
    };

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('Time Entries API: Missing spreadsheet ID');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete. Please check your environment variables.' },
        { status: 500 }
      );
    }

    console.log('Time Entries API: Initializing data service...');
    const dataService = new DataService(spreadsheetId, credentials);
    
    console.log('Time Entries API: Fetching time entries...');
    const timeEntries = await dataService.getTimeEntries();
    
    console.log(`Time Entries API: Returning ${timeEntries.length} time entries`);
    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error('Time Entries API: Error:', error);
    return NextResponse.json(
      { error: `Failed to fetch time entries: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Time Entries API: Starting POST request...');
    
    const timeEntryData = await request.json();
    
    const credentials = {
      email: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      apiKey: process.env.GOOGLE_SHEETS_API_KEY,
    };

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('Time Entries API: Missing spreadsheet ID');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete' },
        { status: 500 }
      );
    }

    console.log('Time Entries API: Initializing data service...');
    const dataService = new DataService(spreadsheetId, credentials);
    
    console.log('Time Entries API: Creating time entry...');
    const newTimeEntry = await dataService.addTimeEntry(timeEntryData);
    
    console.log('Time Entries API: Time entry created successfully');
    return NextResponse.json(newTimeEntry, { status: 201 });
  } catch (error) {
    console.error('Time Entries API: Error:', error);
    return NextResponse.json(
      { error: `Failed to create time entry: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}