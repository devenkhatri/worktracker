import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Project Update API: Starting request...');
    
    const projectId = params.id;
    const projectData = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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
      console.error('Project Update API: Missing spreadsheet ID');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete' },
        { status: 500 }
      );
    }

    console.log('Project Update API: Initializing data service...');
    const dataService = new DataService(spreadsheetId, credentials);
    
    console.log(`Project Update API: Updating project ${projectId}...`);
    const updatedProject = await dataService.updateProject(projectId, projectData);
    
    console.log('Project Update API: Project updated successfully');
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Project Update API: Error:', error);
    return NextResponse.json(
      { error: `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}