"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { PaymentForm } from '@/components/payment-form';
import { ConfigVerification } from '@/components/config-verification';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Payment, Invoice } from '@/lib/types';
import { Plus, Loader2, AlertCircle, CreditCard, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [configValid, setConfigValid] = useState<boolean | null>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Payments: Starting data fetch...');
        const [paymentsResponse, invoicesResponse] = await Promise.all([
          fetch('/api/payments'),
          fetch('/api/invoices')
        ]);

        console.log('Payments: Response statuses:', {
          payments: paymentsResponse.status,
          invoices: invoicesResponse.status
        });

        if (!paymentsResponse.ok || !invoicesResponse.ok) {
          const paymentsError = !paymentsResponse.ok ? await paymentsResponse.text() : null;
          const invoicesError = !invoicesResponse.ok ? await invoicesResponse.text() : null;
          console.error('Payments: API errors:', { paymentsError, invoicesError });
          
          const errorText = paymentsError || invoicesError || '';
          if (errorText.includes('configuration') || errorText.includes('environment')) {
            setConfigValid(false);
            setError('Configuration issue detected. Please verify your Google Sheets setup.');
          } else {
            throw new Error(`Failed to fetch data: ${errorText}`);
          }
          return;
        }

        const paymentsData = await paymentsResponse.json();
        const invoicesData = await invoicesResponse.json();

        console.log('Payments: Data received:', {
          paymentsCount: paymentsData.length,
          invoicesCount: invoicesData.length
        });

        setPayments(paymentsData);
        setInvoices(invoicesData);
        setConfigValid(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setConfigValid(false);
        setError(err instanceof Error ? err.message : 'Failed to load payments. Please check your Google Sheets configuration.');
      } finally {
        setLoading(false);
      }
    };

    console.log('Payments: Starting fetch, configValid:', configValid);
    fetchData();
  }, []);

  const handleConfigurationChange = (isValid: boolean) => {
    console.log('Payments: Configuration changed to:', isValid);
    setConfigValid(isValid);
    if (isValid) {
      setLoading(true);
      setError(null);
      window.location.reload(); // Simple refresh for now
    }
  };

  const handleCreatePayment = async (paymentData: Omit<Payment, 'id' | 'recordedDate'>) => {
    try {
      if (editingPayment) {
        console.log('Updating payment with data:', paymentData);
        // TODO: Implement payment update API
        setError('Payment editing not yet implemented');
        return;
      } else {
        console.log('Creating payment with data:', paymentData);
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Payment creation failed:', errorText);
          
          let errorMessage = 'Failed to record payment';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorText;
          } catch {
            errorMessage = errorText || 'Failed to record payment';
          }
          
          throw new Error(errorMessage);
        }

        const newPayment = await response.json();
        setPayments(prev => [...prev, newPayment]);
        
        // Refresh invoices to get updated balances
        const invoicesResponse = await fetch('/api/invoices');
        if (invoicesResponse.ok) {
          const updatedInvoices = await invoicesResponse.json();
          setInvoices(updatedInvoices);
        }
      }
      
      setShowForm(false);
      setEditingPayment(null);
    } catch (err) {
      console.error('Error saving payment:', err);
      setError(editingPayment ? 'Failed to update payment. Please try again.' : 'Failed to record payment. Please try again.');
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  const getInvoiceNumber = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    return invoice ? invoice.invoiceNumber : 'Unknown Invoice';
  };

  const getInvoiceDetails = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    return invoice;
  };

  // Filter invoices that have outstanding balances
  const unpaidInvoices = invoices.filter(invoice => invoice.balanceAmount > 0);

  const columns = [
    { key: 'paymentDate', label: 'Payment Date', sortable: true },
    { 
      key: 'invoiceId', 
      label: 'Invoice', 
      sortable: true,
      render: (value: string) => getInvoiceNumber(value)
    },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
    { key: 'paymentMethod', label: 'Payment Method', sortable: true },
    { key: 'referenceNumber', label: 'Reference', sortable: true },
    { key: 'recordedBy', label: 'Recorded By', sortable: true },
    { key: 'recordedDate', label: 'Recorded Date', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, payment: Payment) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditPayment(payment)}
          className="flex items-center space-x-1 text-xs sm:text-sm"
        >
          <Edit className="h-3 w-3" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      )
    },
  ];

  const renderExpandedRow = (payment: Payment) => {
    const invoice = getInvoiceDetails(payment.invoiceId);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Payment Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Reference Number:</span> {payment.referenceNumber || 'Not provided'}</p>
              <p><span className="font-medium">Recorded Date:</span> {new Date(payment.recordedDate).toLocaleString()}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Invoice Information</h4>
            {invoice && (
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Total Amount:</span> ₹{invoice.totalAmount.toFixed(2)}</p>
                <p><span className="font-medium">Paid Amount:</span> ₹{invoice.paidAmount.toFixed(2)}</p>
                <p><span className="font-medium">Balance:</span> ₹{invoice.balanceAmount.toFixed(2)}</p>
                <p><span className="font-medium">Status:</span> {invoice.status}</p>
              </div>
            )}
          </div>
        </div>
        {payment.notes && (
          <div>
            <h4 className="font-medium mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground break-words">{payment.notes}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none pb-4 mb-6 lg:pb-0 lg:mb-0 lg:static">
          <div className="pt-12 lg:pt-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {editingPayment ? 'Edit Payment' : 'Record New Payment'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {editingPayment ? 'Update payment information' : 'Record a payment received from client'}
            </p>
          </div>
        </div>

        <PaymentForm
          onSubmit={handleCreatePayment}
          onCancel={handleCancelEdit}
          invoices={unpaidInvoices}
          initialData={editingPayment || undefined}
          isEditing={!!editingPayment}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none pb-4 mb-6 lg:pb-0 lg:mb-0 lg:static">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center space-x-2">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8" />
              <span>Payments</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Track and manage invoice payments
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
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

      {/* Outstanding Invoices Summary */}
      {unpaidInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Outstanding Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpaidInvoices.slice(0, 6).map((invoice) => (
                <div key={invoice.id} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">{invoice.invoiceNumber}</div>
                  <div className="text-xs text-muted-foreground">Due: {invoice.dueDate}</div>
                  <div className="text-sm font-semibold text-red-600">
                    ₹{invoice.balanceAmount.toFixed(2)} outstanding
                  </div>
                </div>
              ))}
              {unpaidInvoices.length > 6 && (
                <div className="p-3 border rounded-lg flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    +{unpaidInvoices.length - 6} more invoices
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {configValid === true && payments.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">No Payments Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              No payments have been recorded yet.
            </p>
            <div className="mt-4">
              <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Record Your First Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={payments}
        columns={columns}
        searchPlaceholder="Search payments..."
        expandableRows
        renderExpandedRow={renderExpandedRow}
      />
    </div>
  );
}