"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ClientForm } from '@/components/client-form';
import { ConfigVerification } from '@/components/config-verification';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Client } from '@/lib/types';
import { Plus, Loader2, AlertCircle, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [configValid, setConfigValid] = useState<boolean | null>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Clients: Starting data fetch...');
        const response = await fetch('/api/clients');

        console.log('Clients: Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Clients: API error:', errorText);
          
          if (errorText.includes('configuration') || errorText.includes('environment')) {
            setConfigValid(false);
            setError('Configuration issue detected. Please verify your Google Sheets setup.');
          } else {
            throw new Error(`Failed to fetch data: ${errorText}`);
          }
          return;
        }

        const clientsData = await response.json();

        console.log('Clients: Data received:', {
          clientsCount: clientsData.length
        });

        setClients(clientsData);
        setConfigValid(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setConfigValid(false);
        setError(err instanceof Error ? err.message : 'Failed to load clients. Please check your Google Sheets configuration.');
      } finally {
        setLoading(false);
      }
    };

    console.log('Clients: Starting fetch, configValid:', configValid);
    fetchData();
  }, []);

  const handleConfigurationChange = (isValid: boolean) => {
    console.log('Clients: Configuration changed to:', isValid);
    setConfigValid(isValid);
    if (isValid) {
      setLoading(true);
      setError(null);
      const fetchData = async () => {
        try {
          console.log('Clients: Retrying data fetch after config fix...');
          const response = await fetch('/api/clients');

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch data: ${errorText}`);
          }

          const clientsData = await response.json();
          setClients(clientsData);
          setError(null);
        } catch (err) {
          console.error('Error retrying clients fetch:', err);
          setError(err instanceof Error ? err.message : 'Failed to load clients');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  };

  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'createdDate'>) => {
    if (editingClient) {
      console.log('Updating client with data:', clientData);
      // TODO: Implement client update API
      setError('Client editing not yet implemented');
      return;
    } else {
      console.log('Creating client with data:', clientData);
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Client creation failed:', errorText);
        
        let errorMessage = 'Failed to create client';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {
          errorMessage = errorText || 'Failed to create client';
        }
        
        throw new Error(errorMessage);
      }

      const newClient = await response.json();
      setClients(prev => [...prev, newClient]);
    }
    
    setShowForm(false);
    setEditingClient(null);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const columns = [
    { key: 'id', label: 'Client ID', sortable: true },
    { key: 'clientName', label: 'Client Name', sortable: true },
    { key: 'companyName', label: 'Company', sortable: true },
    { key: 'contactEmail', label: 'Email', sortable: true },
    { key: 'contactPhone', label: 'Phone', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { 
      key: 'hourlyRate', 
      label: 'Hourly Rate', 
      sortable: true,
      render: (value: number) => `₹${value}`
    },
    { 
      key: 'paymentTerms', 
      label: 'Payment Terms', 
      sortable: true,
      render: (value: number) => `${value} days`
    },
    { key: 'createdDate', label: 'Created', sortable: true },
  ];

  const renderExpandedRow = (client: Client) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Contact Information</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Address:</span> {client.address || 'Not provided'}</p>
              <p><span className="font-medium">Tax ID:</span> {client.taxId || 'Not provided'}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground break-words">
              {client.notes || 'No notes available'}
            </p>
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
          <p className="text-muted-foreground text-sm sm:text-base">Loading clients...</p>
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
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {editingClient ? 'Update client information' : 'Add a new client to your system'}
            </p>
          </div>
        </div>

        <ClientForm
          onSubmit={handleCreateClient}
          onCancel={handleCancelEdit}
          initialData={editingClient || undefined}
          isEditing={!!editingClient}
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
              <Users className="h-6 w-6 sm:h-8 sm:w-8" />
              <span>Clients</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your clients and their information
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
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

      {configValid === true && clients.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">No Clients Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              No clients were found in your Google Sheet. This could mean:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Your Clients worksheet is empty (no data rows)</li>
              <li>The data is in a different format than expected</li>
              <li>There might be an issue with the sheet structure</li>
            </ul>
            <div className="mt-4">
              <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={clients}
        columns={columns}
        searchPlaceholder="Search clients..."
        expandableRows
        renderExpandedRow={renderExpandedRow}
      />
    </div>
  );
}