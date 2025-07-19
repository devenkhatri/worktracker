"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ConfigVerification } from '@/components/config-verification';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { InvoicePreview } from '@/components/invoice-preview';
// PDF generation is handled in the InvoicePreview component
import { Invoice, Project, Client } from '@/lib/types';
import { Plus, Loader2, AlertCircle, FileText, Download, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [configValid, setConfigValid] = useState<boolean | null>(true);
  const [generateFormData, setGenerateFormData] = useState({
    projectId: '',
    clientId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Invoices: Starting data fetch...');
        const [invoicesResponse, projectsResponse, clientsResponse] = await Promise.all([
          fetch('/api/invoices'),
          fetch('/api/projects'),
          fetch('/api/clients')
        ]);

        console.log('Invoices: Response statuses:', {
          invoices: invoicesResponse.status,
          projects: projectsResponse.status,
          clients: clientsResponse.status
        });

        if (!invoicesResponse.ok || !projectsResponse.ok || !clientsResponse.ok) {
          const invoicesError = !invoicesResponse.ok ? await invoicesResponse.text() : null;
          const projectsError = !projectsResponse.ok ? await projectsResponse.text() : null;
          const clientsError = !clientsResponse.ok ? await clientsResponse.text() : null;
          console.error('Invoices: API errors:', { invoicesError, projectsError, clientsError });
          
          const errorText = invoicesError || projectsError || clientsError || '';
          if (errorText.includes('configuration') || errorText.includes('environment')) {
            setConfigValid(false);
            setError('Configuration issue detected. Please verify your Google Sheets setup.');
          } else {
            throw new Error(`Failed to fetch data: ${errorText}`);
          }
          return;
        }

        const invoicesData = await invoicesResponse.json();
        const projectsData = await projectsResponse.json();
        const clientsData = await clientsResponse.json();

        console.log('Invoices: Data received:', {
          invoicesCount: invoicesData.length,
          projectsCount: projectsData.length,
          clientsCount: clientsData.length
        });

        setInvoices(invoicesData);
        setProjects(projectsData);
        setClients(clientsData);
        setConfigValid(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setConfigValid(false);
        setError(err instanceof Error ? err.message : 'Failed to load invoices. Please check your Google Sheets configuration.');
      } finally {
        setLoading(false);
      }
    };

    console.log('Invoices: Starting fetch, configValid:', configValid);
    fetchData();
  }, []);

  const handleConfigurationChange = (isValid: boolean) => {
    console.log('Invoices: Configuration changed to:', isValid);
    setConfigValid(isValid);
    if (isValid) {
      setLoading(true);
      setError(null);
      window.location.reload(); // Simple refresh for now
    }
  };

  const handlePreviewInvoice = async () => {
    try {
      if (!generateFormData.projectId || !generateFormData.clientId) {
        setError('Please select both project and client');
        return;
      }

      setPreviewLoading(true);
      console.log('Getting invoice preview with data:', generateFormData);
      
      const response = await fetch('/api/invoices/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateFormData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Invoice preview failed:', errorText);
        
        let errorMessage = 'Failed to generate invoice preview';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {
          errorMessage = errorText || 'Failed to generate invoice preview';
        }
        
        throw new Error(errorMessage);
      }

      const preview = await response.json();
      
      // Validate preview data structure
      if (!preview || !preview.invoice || !preview.client || !preview.project) {
        throw new Error('Invalid preview data received from server');
      }
      
      console.log('Preview data received:', preview);
      setPreviewData(preview);
      setShowPreview(true);
      setShowGenerateForm(false);
      setError(null);
    } catch (err) {
      console.error('Error getting invoice preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate invoice preview. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setGenerateLoading(true);
      console.log('Generating invoice with data:', generateFormData);
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateFormData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Invoice generation failed:', errorText);
        
        let errorMessage = 'Failed to generate invoice';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {
          errorMessage = errorText || 'Failed to generate invoice';
        }
        
        throw new Error(errorMessage);
      }

      const newInvoice = await response.json();
      setInvoices(prev => [...prev, newInvoice]);
      setShowPreview(false);
      setPreviewData(null);
      setGenerateFormData({ projectId: '', clientId: '' });
      setError(null);
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate invoice. Please try again.');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      console.log('Downloading PDF for invoice:', invoice.id);
      
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to get invoice data for PDF');
      }
      
      const pdfData = await response.json();
      
      // Generate and download PDF
      const htmlContent = generateInvoiceHTML(pdfData);
      PDFGenerator.downloadHTMLAsPDF(htmlContent, `Invoice-${invoice.invoiceNumber}.pdf`);
      
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF. Please try again.');
    }
  };

  const generateInvoiceHTML = (data: any) => {
    // This is a simplified version - you can enhance this
    const { invoice, client, project, timeEntries } = data;
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR' 
      }).format(amount);
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>${invoice.invoiceNumber}</h2>
        </div>
        <div class="invoice-details">
          <p><strong>Client:</strong> ${client.clientName}</p>
          <p><strong>Project:</strong> ${project.projectName}</p>
          <p><strong>Issue Date:</strong> ${invoice.issueDate}</p>
          <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${timeEntries.map((entry: any) => `
              <tr>
                <td>${entry.date}</td>
                <td>${entry.description || 'Time entry'}</td>
                <td>${entry.duration.toFixed(2)}</td>
                <td>${formatCurrency(project.perHourRate)}</td>
                <td>${formatCurrency(entry.duration * project.perHourRate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          <p>Subtotal: ${formatCurrency(invoice.subtotal)}</p>
          <p>Tax: ${formatCurrency(invoice.taxAmount)}</p>
          <p>Total: ${formatCurrency(invoice.totalAmount)}</p>
        </div>
      </body>
      </html>
    `;
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.projectName : 'Unknown Project';
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.clientName : 'Unknown Client';
  };

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
    { 
      key: 'clientId', 
      label: 'Client', 
      sortable: true,
      render: (value: string) => getClientName(value)
    },
    { 
      key: 'projectId', 
      label: 'Project', 
      sortable: true,
      render: (value: string) => getProjectName(value)
    },
    { key: 'issueDate', label: 'Issue Date', sortable: true },
    { key: 'dueDate', label: 'Due Date', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { 
      key: 'totalAmount', 
      label: 'Total Amount', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
    { 
      key: 'balanceAmount', 
      label: 'Balance', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
  ];

  const renderExpandedRow = (invoice: Invoice) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Invoice Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Subtotal:</span> ₹{invoice.subtotal.toFixed(2)}</p>
              <p><span className="font-medium">Tax ({(invoice.taxRate * 100).toFixed(0)}%):</span> ₹{invoice.taxAmount.toFixed(2)}</p>
              <p><span className="font-medium">Paid Amount:</span> ₹{invoice.paidAmount.toFixed(2)}</p>
              {invoice.paymentDate && (
                <p><span className="font-medium">Payment Date:</span> {invoice.paymentDate}</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground break-words">
              {invoice.notes || 'No notes available'}
            </p>
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDownloadPDF(invoice)}
              >
                <Download className="h-3 w-3 mr-1" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (showPreview && previewData) {
    return (
      <div className="space-y-6">
        <InvoicePreview
          previewData={previewData}
          onConfirm={handleGenerateInvoice}
          onCancel={() => {
            setShowPreview(false);
            setPreviewData(null);
            setShowGenerateForm(true);
          }}
          onEdit={() => {
            setShowPreview(false);
            setPreviewData(null);
            setShowGenerateForm(true);
          }}
        />
      </div>
    );
  }

  if (showGenerateForm) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none pb-4 mb-6 lg:pb-0 lg:mb-0 lg:static">
          <div className="pt-12 lg:pt-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Generate Invoice</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Create a new invoice based on project time entries
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectId">Project</Label>
                <Select 
                  value={generateFormData.projectId} 
                  onValueChange={(value) => setGenerateFormData(prev => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.projectName} - {project.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="clientId">Client</Label>
                <Select 
                  value={generateFormData.clientId} 
                  onValueChange={(value) => setGenerateFormData(prev => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowGenerateForm(false)}
                className="w-full sm:w-auto"
                disabled={previewLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePreviewInvoice} 
                className="w-full sm:w-auto"
                disabled={previewLoading || !generateFormData.projectId || !generateFormData.clientId}
              >
                {previewLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Invoice
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none pb-4 mb-6 lg:pb-0 lg:mb-0 lg:static">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center space-x-2">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
              <span>Invoices</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage invoices and billing
            </p>
          </div>
          <Button onClick={() => setShowGenerateForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {configValid === false && (
        <ConfigVerification onConfigurationValid={handleConfigurationChange} />
      )}

      {configValid === true && invoices.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">No Invoices Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              No invoices have been generated yet.
            </p>
            <div className="mt-4">
              <Button onClick={() => setShowGenerateForm(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Generate Your First Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={invoices}
        columns={columns}
        searchPlaceholder="Search invoices..."
        expandableRows
        renderExpandedRow={renderExpandedRow}
      />
    </div>
  );
}