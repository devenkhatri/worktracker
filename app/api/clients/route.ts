import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function GET() {
  try {
    console.log('API: Starting clients fetch...');
    
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required.' },
        { status: 500 }
      );
    }

    const credentials: { email?: string; privateKey?: string; apiKey?: string } = {};
    
    if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      credentials.email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
      credentials.privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
      console.log('Using Service Account authentication');
    } else if (process.env.GOOGLE_SHEETS_API_KEY) {
      credentials.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
      console.log('Using API Key authentication (read-only)');
    } else {
      return NextResponse.json(
        { error: 'Either Service Account credentials or API key must be provided.' },
        { status: 500 }
      );
    }

    console.log('Creating DataService...');
    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );
    
    console.log('Calling getClients...');
    const clients = await dataService.getClients();
    console.log('Clients fetched:', clients.length, 'items');
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: `Failed to fetch clients: ${error instanceof Error ? error.message : 'Unknown error'}` },
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

    const credentials: { email?: string; privateKey?: string; apiKey?: string } = {};
    
    if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      credentials.email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
      credentials.privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    } else {
      return NextResponse.json(
        { error: 'Service Account credentials are required for creating clients.' },
        { status: 500 }
      );
    }

    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );
    
    const body = await request.json();
    const client = await dataService.addClient(body);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}