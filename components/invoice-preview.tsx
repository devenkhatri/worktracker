"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Invoice, Client, Project, TimeEntry } from '@/lib/types';
import { Download, Printer } from 'lucide-react';

interface InvoicePreviewProps {
  invoice?: Invoice;
  client?: Client;
  project?: Project;
  timeEntries?: TimeEntry[];
  previewData?: {
    invoice: Invoice;
    client: Client;
    project: Project;
    timeEntries: TimeEntry[];
  };
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

export function InvoicePreview({ 
  invoice: propInvoice, 
  client: propClient, 
  project: propProject, 
  timeEntries: propTimeEntries = [], 
  previewData,
  onClose,
  onConfirm,
  onCancel,
  onEdit
}: InvoicePreviewProps) {
  // Use previewData if available, otherwise use individual props
  const invoice = previewData?.invoice || propInvoice;
  const client = previewData?.client || propClient;
  const project = previewData?.project || propProject;
  const timeEntries = previewData?.timeEntries || propTimeEntries;

  // Debug logging
  console.log('InvoicePreview - Props received:', {
    hasPreviewData: !!previewData,
    hasInvoice: !!invoice,
    hasClient: !!client,
    hasProject: !!project,
    timeEntriesCount: timeEntries?.length || 0
  });
  const [loading, setLoading] = useState(false);

  // Safety check - if no invoice data, show error
  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Invoice Data Missing</h2>
          <p className="text-gray-600 mb-4">Unable to load invoice information. Please try again.</p>
          <div className="space-x-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>Go Back</Button>
            )}
            {onClose && (
              <Button onClick={onClose}>Close</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold">
          {previewData ? 'Invoice Preview' : 'Invoice'}
        </h2>
        <div className="flex space-x-2">
          {previewData ? (
            // Preview mode buttons
            <>
              <Button variant="outline" onClick={onEdit}>
                Edit
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={onConfirm}>
                Generate Invoice
              </Button>
            </>
          ) : (
            // View mode buttons
            <>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownloadPDF} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Download PDF'}
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white border rounded-lg p-8 print:border-0 print:shadow-none">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <p className="text-gray-600">Invoice #{invoice?.invoiceNumber || 'N/A'}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Company Name</h2>
            <p className="text-gray-600">
              Your Address Line 1<br />
              Your Address Line 2<br />
              City, State, PIN Code<br />
              Email: your-email@company.com<br />
              Phone: +91 XXXXX XXXXX
            </p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
            <div className="text-gray-700">
              <p className="font-medium">{client?.clientName || 'Client Name Not Available'}</p>
              {client?.companyName && <p>{client.companyName}</p>}
              {client?.address && <p className="whitespace-pre-line">{client.address}</p>}
              {client?.contactEmail && <p>Email: {client.contactEmail}</p>}
              {client?.contactPhone && <p>Phone: {client.contactPhone}</p>}
              {client?.taxId && <p>Tax ID: {client.taxId}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details:</h3>
            <div className="text-gray-700 space-y-1">
              <p><span className="font-medium">Issue Date:</span> {invoice?.issueDate ? formatDate(invoice.issueDate) : 'N/A'}</p>
              <p><span className="font-medium">Due Date:</span> {invoice?.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  invoice?.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  invoice?.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                  invoice?.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {invoice?.status || 'Draft'}
                </span>
              </p>
              {project && <p><span className="font-medium">Project:</span> {project.projectName}</p>}
            </div>
          </div>
        </div>

        {/* Time Entries Table */}
        {timeEntries.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Entries</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Hours</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Rate</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((entry, index) => (
                    <tr key={entry.id || index}>
                      <td className="border border-gray-300 px-4 py-2">{formatDate(entry.date)}</td>
                      <td className="border border-gray-300 px-4 py-2">{entry.description || 'Time entry'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{entry.duration.toFixed(2)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">₹{project?.perHourRate || 0}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        ₹{((entry.duration * (project?.perHourRate || 0))).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoice Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Tax ({((invoice?.taxRate || 0) * 100).toFixed(0)}%):</span>
                <span className="font-medium">{formatCurrency(invoice?.taxAmount || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(invoice?.totalAmount || 0)}</span>
              </div>
              {(invoice?.paidAmount || 0) > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span>-{formatCurrency(invoice?.paidAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-red-600">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(invoice?.balanceAmount || 0)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Terms</h3>
          <div className="text-gray-700 space-y-1">
            <p>Payment is due within {client?.paymentTerms || 30} days of invoice date.</p>
            <p>Please include the invoice number with your payment.</p>
            {invoice?.notes && (
              <div className="mt-4">
                <h4 className="font-medium">Notes:</h4>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t mt-8 pt-6 text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}