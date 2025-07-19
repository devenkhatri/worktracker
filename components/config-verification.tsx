"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface ConfigVerificationProps {
  onConfigurationValid?: (isValid: boolean) => void;
}

interface VerificationResult {
  success: boolean;
  message: string;
  details?: any;
}

export function ConfigVerification({ onConfigurationValid }: ConfigVerificationProps) {
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const verifyConfiguration = async () => {
    setLoading(true);
    console.log('ConfigVerification: Starting verification...');
    try {
      const response = await fetch('/api/verify-config');
      console.log('ConfigVerification: Response status:', response.status);
      const result = await response.json();
      console.log('ConfigVerification: Result:', result);
      setVerification(result);
      onConfigurationValid?.(result.success);
    } catch (error) {
      console.error('ConfigVerification: Error:', error);
      setVerification({
        success: false,
        message: 'Failed to verify configuration',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      onConfigurationValid?.(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyConfiguration();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expectedHeaders = {
    Projects: ['Project ID', 'Project Name', 'Client Name', 'Project Description', 'Start Date', 'End Date', 'Status', 'Budget', 'Per Hour Rate', 'Total Estimated Hours', 'Total Actual Hours', 'Total Billed Hours', 'Total Amount'],
    Tasks: ['Task ID', 'Project ID', 'Task Name', 'Task Description', 'Assigned To', 'Priority', 'Status', 'Estimated Hours', 'Actual Hours', 'Billed Hours', 'Project Per Hour Rate', 'Task Per Hour Rate', 'Calculated Amount', 'Due Date', 'Artifacts'],
    TimeEntries: ['Time Entry ID', 'Project ID', 'Task ID', 'Date', 'Start Time', 'End Time', 'Duration', 'Description/Notes', 'User/Employee Name'],
    Activities: ['Activity ID', 'Timestamp', 'Type', 'Description', 'Entity ID', 'Entity Name', 'User Name', 'Metadata'],
    Users: ['Username', 'Password', 'Last Login']
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            {verification?.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : verification === null ? (
              <RefreshCw className={`h-5 w-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span>Google Sheets Configuration</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={verifyConfiguration}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verify
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {verification && (
          <Alert>
            {verification.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              {verification.message}
            </AlertDescription>
          </Alert>
        )}

        {verification?.success && verification.details && (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Configuration Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Spreadsheet:</span>
                  <span className="font-medium">{verification.details.spreadsheetTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Spreadsheet ID:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {verification.details.spreadsheetId?.substring(0, 20)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(verification.details.spreadsheetId)}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Worksheets:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {verification.details.worksheets?.map((sheet: string) => (
                      <Badge key={sheet} variant="secondary" className="text-xs">
                        {sheet}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!verification?.success && verification?.details && (
          <div className="space-y-4">
            {verification.details.missingEnvVars && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-red-600">Missing Environment Variables</h4>
                <div className="space-y-2">
                  {verification.details.missingEnvVars.map((envVar: string) => (
                    <div key={envVar} className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <code className="text-sm bg-muted px-2 py-1 rounded">{envVar}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {verification.details.missingSheets && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-red-600">Missing Worksheets</h4>
                <div className="space-y-2">
                  {verification.details.missingSheets.map((sheet: string) => (
                    <div key={sheet} className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">{sheet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {verification.details.headerIssues && (
              <div>
                <h4 className="font-medium text-sm mb-2 text-red-600">Header Issues</h4>
                <div className="space-y-2">
                  {verification.details.headerIssues.map((issue: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span className="text-sm">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-3">Setup Instructions</h4>
          <div className="space-y-3 text-sm">
            <div>
              <h5 className="font-medium mb-1">1. Google Sheets API Setup</h5>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                <li>Enable the Google Sheets API</li>
                <li>Create an API key</li>
                <li>Update your .env file with the API key</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium mb-1">2. Create Google Sheet</h5>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Create a new Google Sheet</li>
                <li>Make it publicly viewable (Share → Anyone with the link can view)</li>
                <li>Copy the spreadsheet ID from the URL</li>
                <li>Update your .env file with the spreadsheet ID</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium mb-1">3. Create Required Worksheets</h5>
              <div className="space-y-2">
                {Object.entries(expectedHeaders).map(([sheetName, headers]) => (
                  <div key={sheetName} className="border rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{sheetName} Sheet</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(headers.join('\t'))}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Headers (Row 1): {headers.slice(0, 3).join(', ')}
                      {headers.length > 3 && ` ... and ${headers.length - 3} more`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}