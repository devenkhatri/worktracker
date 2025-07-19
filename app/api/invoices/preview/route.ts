import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, clientId } = body;
    
    if (!projectId || !clientId) {
      return NextResponse.json(
        { error: 'Project ID and Client ID are required' },
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
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete' },
        { status: 500 }
      );
    }

    const dataService = new DataService(spreadsheetId, credentials);
    
    // Get related data for preview
    const [clients, projects, timeEntries] = await Promise.all([
      dataService.getClients(),
      dataService.getProjects(),
      dataService.getTimeEntries()
    ]);

    const client = clients.find(c => c.id === clientId);
    const project = projects.find(p => p.id === projectId);
    
    if (!client || !project) {
      return NextResponse.json(
        { error: 'Client or Project not found' },
        { status: 404 }
      );
    }

    // Get unbilled time entries for the project
    const projectTimeEntries = timeEntries.filter(te => te.projectId === projectId);
    
    // Calculate preview invoice data
    const subtotal = projectTimeEntries.reduce((sum, entry) => sum + (entry.duration * project.perHourRate), 0);
    const taxRate = 0.18; // 18% GST
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    
    const previewInvoice = {
      id: 'preview',
      invoiceNumber: `PREVIEW-${Date.now()}`,
      clientId,
      projectId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + (client.paymentTerms * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      status: 'Draft' as const,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      notes: `Preview invoice for project: ${project.projectName}`,
      createdBy: 'System',
      createdDate: new Date().toISOString(),
    };

    return NextResponse.json({
      invoice: previewInvoice,
      client,
      project,
      timeEntries: projectTimeEntries
    });

  } catch (error) {
    console.error('Error generating invoice preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice preview' },
      { status: 500 }
    );
  }
}