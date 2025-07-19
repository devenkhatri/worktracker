"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Payment, Invoice } from '@/lib/types';

interface PaymentFormProps {
  onSubmit: (payment: Omit<Payment, 'id' | 'recordedDate'>) => void;
  onCancel: () => void;
  invoices: Invoice[];
  initialData?: Partial<Payment>;
  isEditing?: boolean;
}

export function PaymentForm({ onSubmit, onCancel, invoices, initialData, isEditing = false }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    invoiceId: initialData?.invoiceId || '',
    paymentDate: initialData?.paymentDate || new Date().toISOString().split('T')[0],
    amount: initialData?.amount || 0,
    paymentMethod: initialData?.paymentMethod || 'Bank Transfer' as Payment['paymentMethod'],
    referenceNumber: initialData?.referenceNumber || '',
    notes: initialData?.notes || '',
    recordedBy: initialData?.recordedBy || 'System User', // TODO: Get from auth context
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectedInvoice = invoices.find(inv => inv.id === formData.invoiceId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Payment' : 'Record New Payment'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="invoiceId">Invoice</Label>
            <Select value={formData.invoiceId} onValueChange={(value) => handleInputChange('invoiceId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - ₹{invoice.balanceAmount.toFixed(2)} remaining
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInvoice && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Invoice Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Total Amount:</span> ₹{selectedInvoice.totalAmount.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Paid Amount:</span> ₹{selectedInvoice.paidAmount.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Balance:</span> ₹{selectedInvoice.balanceAmount.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedInvoice.status}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Payment Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                max={selectedInvoice?.balanceAmount || undefined}
                required
              />
              {selectedInvoice && formData.amount > selectedInvoice.balanceAmount && (
                <p className="text-sm text-red-600 mt-1">
                  Amount cannot exceed balance of ₹{selectedInvoice.balanceAmount.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={formData.referenceNumber}
                onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                placeholder="Transaction ID, Check number, etc."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes about the payment..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              disabled={selectedInvoice && formData.amount > selectedInvoice.balanceAmount}
            >
              {isEditing ? 'Update Payment' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}