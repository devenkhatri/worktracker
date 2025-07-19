import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function GET() {
  try {
    console.log('API: Starting projects fetch...');
    
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.error('Missing environment variables');
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
      console.log('Using Service Account authentication');
    } else if (process.env.GOOGLE_SHEETS_API_KEY) {
      credentials.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
      console.log('Using API Key authentication (read-only)');
    } else {
      return NextResponse.json(
        { error: 'Either Service Account credentials (GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL + GOOGLE_SHEETS_PRIVATE_KEY) or API key (GOOGLE_SHEETS_API_KEY) must be provided.' },
        { status: 500 }
      );
    }

    console.log('Creating DataService...');
    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );
    
    console.log('Calling getProjects...');
    const projects = await dataService.getProjects();
    console.log('Projects fetched:', projects.length, 'items');
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: `Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}` },
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

    // Prepare credentials - Service Account required for write operations
    const credentials: { email?: string; privateKey?: string; apiKey?: string } = {};
    
    if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      credentials.email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
      credentials.privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    } else if (process.env.GOOGLE_SHEETS_API_KEY) {
      credentials.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
      // This will fail later with a clear error message about needing Service Account
    } else {
      return NextResponse.json(
        { error: 'Service Account credentials (GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL + GOOGLE_SHEETS_PRIVATE_KEY) are required for creating projects.' },
        { status: 500 }
      );
    }

    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );
    
    const body = await request.json();
    const project = await dataService.addProject(body);
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}