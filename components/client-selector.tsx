"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, UserPlus } from 'lucide-react';
import { Client } from '@/lib/types';

interface ClientSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  clients: Client[];
  onCreateClient: (client: Omit<Client, 'id' | 'createdDate'>) => Promise<Client>;
  placeholder?: string;
  disabled?: boolean;
}

export function ClientSelector({ 
  value, 
  onValueChange, 
  clients, 
  onCreateClient, 
  placeholder = "Select a client",
  disabled = false 
}: ClientSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    clientName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    companyName: '',
    taxId: '',
    paymentTerms: 30,
    hourlyRate: 0,
    status: 'Active' as Client['status'],
    notes: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const newClient = await onCreateClient(newClientData);
      setIsCreateDialogOpen(false);
      setNewClientData({
        clientName: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        companyName: '',
        taxId: '',
        paymentTerms: 30,
        hourlyRate: 0,
        status: 'Active',
        notes: '',
      });
      // Select the newly created client
      onValueChange(newClient.clientName);
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setNewClientData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const selectedClient = clients.find(client => client.clientName === value);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.clientName}>
                  <div className="flex flex-col">
                    <span className="font-medium">{client.clientName}</span>
                    {client.companyName && (
                      <span className="text-xs text-muted-foreground">{client.companyName}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              disabled={disabled}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create New Client
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newClientName">Client Name *</Label>
                  <Input
                    id="newClientName"
                    value={newClientData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newCompanyName">Company Name</Label>
                  <Input
                    id="newCompanyName"
                    value={newClientData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newContactEmail">Contact Email *</Label>
                  <Input
                    id="newContactEmail"
                    type="email"
                    value={newClientData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newContactPhone">Contact Phone</Label>
                  <Input
                    id="newContactPhone"
                    value={newClientData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="newAddress">Address</Label>
                <Input
                  id="newAddress"
                  value={newClientData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="newTaxId">Tax ID</Label>
                  <Input
                    id="newTaxId"
                    value={newClientData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="newPaymentTerms">Payment Terms (Days)</Label>
                  <Input
                    id="newPaymentTerms"
                    type="number"
                    value={newClientData.paymentTerms}
                    onChange={(e) => handleInputChange('paymentTerms', parseInt(e.target.value) || 30)}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="newHourlyRate">Default Hourly Rate (₹)</Label>
                  <Input
                    id="newHourlyRate"
                    type="number"
                    value={newClientData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Client'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {selectedClient && (
        <div className="text-sm text-muted-foreground">
          {selectedClient.companyName && (
            <div>Company: {selectedClient.companyName}</div>
          )}
          {selectedClient.contactEmail && (
            <div>Email: {selectedClient.contactEmail}</div>
          )}
          {selectedClient.contactPhone && (
            <div>Phone: {selectedClient.contactPhone}</div>
          )}
        </div>
      )}
    </div>
  );
} 