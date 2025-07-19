import { GoogleSheetsResponse, GoogleSheetsUpdateResponse } from './types';
import { createSign } from 'crypto';

const GOOGLE_SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export class GoogleSheetsService {
  private spreadsheetId: string;
  private serviceAccountEmail: string | null = null;
  private privateKey: string | null = null;
  private apiKey: string | null = null;
  private authMode: 'service_account' | 'api_key';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(spreadsheetId: string, credentials?: { email?: string; privateKey?: string; apiKey?: string }) {
    if (!spreadsheetId) {
      throw new Error('Google Sheets Spreadsheet ID is required. Please check your GOOGLE_SHEETS_SPREADSHEET_ID environment variable.');
    }
    
    this.spreadsheetId = spreadsheetId;
    
    // Determine authentication mode based on available credentials
    if (credentials?.email && credentials?.privateKey) {
      this.authMode = 'service_account';
      this.serviceAccountEmail = credentials.email;
      this.privateKey = this.cleanPrivateKey(credentials.privateKey);
      console.log('Using Service Account authentication');
    } else if (credentials?.apiKey) {
      this.authMode = 'api_key';
      this.apiKey = credentials.apiKey;
      console.warn('Using API key authentication - write operations will be limited. Consider upgrading to Service Account for full functionality.');
    } else {
      throw new Error('Either Service Account credentials (email + private key) or API key must be provided.');
    }
  }

  /**
   * Clean and format the private key properly
   */
  private cleanPrivateKey(privateKey: string): string {
    try {
      // Remove any extra quotes and clean up the key
      let cleanKey = privateKey.trim();
      
      // Remove surrounding quotes if present
      if ((cleanKey.startsWith('"') && cleanKey.endsWith('"')) || 
          (cleanKey.startsWith("'") && cleanKey.endsWith("'"))) {
        cleanKey = cleanKey.slice(1, -1);
      }
      
      // Replace literal \n with actual newlines
      cleanKey = cleanKey.replace(/\\n/g, '\n');
      
      // Ensure proper formatting
      if (!cleanKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Private key must include BEGIN PRIVATE KEY header');
      }
      
      if (!cleanKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Private key must include END PRIVATE KEY footer');
      }
      
      return cleanKey;
    } catch (error) {
      console.error('Error cleaning private key:', error);
      throw new Error(`Invalid private key format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create JWT token manually without google-auth-library to avoid compatibility issues
   */
  private async createJWTToken(): Promise<string> {
    if (!this.serviceAccountEmail || !this.privateKey) {
      throw new Error('Service Account credentials not available');
    }

    try {
      // JWT Header
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      };

      // JWT Payload
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: this.serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600, // 1 hour
        iat: now
      };

      // Encode header and payload
      const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
      const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
      
      // Create signature
      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      const signature = this.signWithRSA256(signatureInput, this.privateKey);
      
      return `${signatureInput}.${signature}`;
    } catch (error) {
      console.error('Error creating JWT token:', error);
      throw new Error(`Failed to create JWT token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    const base64 = Buffer.from(str, 'utf8').toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Sign with RSA-SHA256 using Node.js crypto module
   */
  private signWithRSA256(data: string, privateKey: string): string {
    try {
      // Ensure private key is properly formatted
      let formattedKey = privateKey.trim();
      if (!formattedKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Private key must start with -----BEGIN PRIVATE KEY-----');
      }
      if (!formattedKey.endsWith('-----END PRIVATE KEY-----')) {
        throw new Error('Private key must end with -----END PRIVATE KEY-----');
      }

      // Create a sign object with the correct algorithm
      const sign = createSign('sha256');
      sign.update(data, 'utf8');
      
      // Sign the data with the private key using RSA-SHA256
      const signature = sign.sign(formattedKey, 'base64');
      
      // Convert to base64url format
      return signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } catch (error) {
      console.error('Error signing with RSA256:', error);
      throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Exchange JWT for access token
   */
  private async exchangeJWTForToken(jwt: string): Promise<string> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
      }

      const tokenData = await response.json();
      
      if (!tokenData.access_token) {
        throw new Error('No access token received from Google');
      }

      // Cache the token with expiry
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // Refresh 1 minute early
      
      return tokenData.access_token;
    } catch (error) {
      console.error('Error exchanging JWT for token:', error);
      throw new Error(`Failed to get access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get access token for Service Account authentication
   */
  private async getAccessToken(): Promise<string> {
    if (this.authMode !== 'service_account') {
      throw new Error('Service Account not configured');
    }

    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('Getting new access token...');
      const jwt = await this.createJWTToken();
      const accessToken = await this.exchangeJWTForToken(jwt);
      console.log('Access token obtained successfully');
      return accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get authorization headers based on authentication mode
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authMode === 'service_account') {
      const accessToken = await this.getAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    // For API key mode, we'll add the key as a query parameter

    return headers;
  }

  /**
   * Build URL with appropriate authentication
   */
  private buildUrl(endpoint: string): string {
    if (this.authMode === 'api_key' && this.apiKey) {
      const separator = endpoint.includes('?') ? '&' : '?';
      return `${endpoint}${separator}key=${this.apiKey}`;
    }
    return endpoint;
  }

  /**
   * Validates data before sending to Google Sheets API
   * Ensures all values are strings and handles null/undefined values
   */
  private validateAndFormatData(values: any[][]): string[][] {
    return values.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) {
          return '';
        }
        return String(cell);
      })
    );
  }

  /**
   * Implements retry logic for API calls with exponential backoff
   */
  private async retryApiCall<T>(
    apiCall: () => Promise<T>, 
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication or permission errors
        if (error instanceof Error && (
          error.message.includes('403') || 
          error.message.includes('401') ||
          error.message.includes('API key not valid') ||
          error.message.includes('invalid_grant')
        )) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  async getSheetData(range: string): Promise<GoogleSheetsResponse> {
    const baseUrl = `${GOOGLE_SHEETS_API_URL}/${this.spreadsheetId}/values/${range}`;
    const url = this.buildUrl(baseUrl);
    
    console.log(`Fetching data from range: ${range} using ${this.authMode} authentication`);
    
    return this.retryApiCall(async () => {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, { headers });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Parse error details if available
        let errorDetails = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorText;
        } catch {
          errorDetails = errorText;
        }
        
        // Provide specific error messages
        if (response.status === 403) {
          if (this.authMode === 'api_key') {
            throw new Error('Access denied. API keys have limited permissions. Consider upgrading to Service Account authentication for full access.');
          } else {
            throw new Error('Access denied. Please ensure the Service Account has been granted access to the spreadsheet.');
          }
        }
        
        if (response.status === 404) {
          throw new Error('Spreadsheet or range not found. Please verify your spreadsheet ID and range specification.');
        }
        
        throw new Error(`Failed to fetch data from Google Sheets (${response.status}): ${response.statusText}. ${errorDetails}`);
      }
      
      const data = await response.json();
      console.log('Data fetched successfully:', { range, rowCount: data.values?.length || 0 });
      return data;
    });
  }

  async updateSheetData(range: string, values: any[][]): Promise<GoogleSheetsUpdateResponse> {
    if (this.authMode === 'api_key') {
      throw new Error('Write operations require Service Account authentication. API keys only provide read access.');
    }

    // Validate and format data
    const formattedValues = this.validateAndFormatData(values);
    
    console.log('Updating sheet data:', { range, rowCount: formattedValues.length });
    
    const baseUrl = `${GOOGLE_SHEETS_API_URL}/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`;
    const url = this.buildUrl(baseUrl);
    
    return this.retryApiCall(async () => {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: formattedValues,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        
        // Parse error details
        let errorDetails = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorText;
          
          // Specific error handling for common issues
          if (errorDetails.includes('Unable to parse range')) {
            throw new Error(`Invalid range format: ${range}. Please check the sheet name and range specification.`);
          }
          
          if (errorDetails.includes('Requested entity was not found')) {
            throw new Error(`Sheet not found: The worksheet "${range.split('!')[0]}" does not exist in your Google Sheet.`);
          }
          
        } catch (parseError) {
          errorDetails = errorText;
        }
        
        throw new Error(`Failed to update data (${response.status}): ${response.statusText}. ${errorDetails}`);
      }

      const result = await response.json();
      console.log('Update successful:', { updatedCells: result.updatedCells });
      return result;
    });
  }

  async appendSheetData(range: string, values: any[][]): Promise<GoogleSheetsUpdateResponse> {
    if (this.authMode === 'api_key') {
      throw new Error('Write operations require Service Account authentication. API keys only provide read access.');
    }

    // Validate and format data
    const formattedValues = this.validateAndFormatData(values);
    
    console.log('Appending sheet data:', { range, rowCount: formattedValues.length });
    
    const baseUrl = `${GOOGLE_SHEETS_API_URL}/${this.spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    const url = this.buildUrl(baseUrl);
    
    return this.retryApiCall(async () => {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: formattedValues,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Append error response:', errorText);
        
        // Parse error details
        let errorDetails = '';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorText;
          
          // Specific error handling for common issues
          if (errorDetails.includes('Unable to parse range')) {
            throw new Error(`Invalid range format: ${range}. Please check the sheet name and range specification.`);
          }
          
          if (errorDetails.includes('Requested entity was not found')) {
            throw new Error(`Sheet not found: The worksheet "${range.split('!')[0]}" does not exist in your Google Sheet.`);
          }
          
        } catch (parseError) {
          errorDetails = errorText;
        }
        
        throw new Error(`Failed to append data (${response.status}): ${response.statusText}. ${errorDetails}`);
      }

      const result = await response.json();
      console.log('Append successful:', { updatedCells: result.updatedCells });
      return result;
    });
  }

  generateProjectId(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PROJ-${year}-${timestamp}-${random}`;
  }

  generateTaskId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TASK-${timestamp}-${random}`;
  }

  generateTimeEntryId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TIME-${timestamp}-${random}`;
  }

  generateActivityId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ACT-${timestamp}-${random}`;
  }

  async verifyConfiguration(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Test basic API access
      const baseUrl = `${GOOGLE_SHEETS_API_URL}/${this.spreadsheetId}`;
      const url = this.buildUrl(baseUrl);
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403) {
          if (this.authMode === 'service_account') {
            return {
              success: false,
              message: 'Access denied. Please ensure the Service Account email has been granted Editor access to the spreadsheet.',
              details: { authMode: this.authMode, ...errorData }
            };
          } else {
            return {
              success: false,
              message: 'Access denied. API key has limited permissions. Consider upgrading to Service Account for full functionality.',
              details: { authMode: this.authMode, ...errorData }
            };
          }
        }
        
        if (response.status === 404) {
          return {
            success: false,
            message: 'Spreadsheet not found. Please verify your spreadsheet ID is correct.',
            details: errorData
          };
        }
        
        return {
          success: false,
          message: `API Error (${response.status}): ${response.statusText}`,
          details: errorData
        };
      }
      
      const spreadsheetInfo = await response.json();
      
      // Check for required worksheets
      const requiredSheets = ['Projects', 'Tasks', 'TimeEntries', 'Activities', 'Users'];
      const existingSheets = spreadsheetInfo.sheets?.map((sheet: any) => sheet.properties.title) || [];
      const missingSheets = requiredSheets.filter(sheet => !existingSheets.includes(sheet));
      
      if (missingSheets.length > 0) {
        return {
          success: false,
          message: `Missing required worksheets: ${missingSheets.join(', ')}. Please create these worksheets in your Google Sheet.`,
          details: { existingSheets, missingSheets }
        };
      }
      
      // Test reading from each sheet to verify headers
      const headerTests = await Promise.allSettled([
        this.getSheetData('Projects!1:1'),
        this.getSheetData('Tasks!1:1'),
        this.getSheetData('TimeEntries!1:1'),
        this.getSheetData('Activities!1:1'),
        this.getSheetData('Users!1:1')
      ]);
      
      const headerIssues = [];
      const expectedHeaders = {
        Projects: ['Project ID', 'Project Name', 'Client Name', 'Project Description', 'Start Date', 'End Date', 'Status', 'Budget', 'Per Hour Rate', 'Total Estimated Hours', 'Total Actual Hours', 'Total Billed Hours', 'Total Amount'],
        Tasks: ['Task ID', 'Project ID', 'Task Name', 'Task Description', 'Assigned To', 'Priority', 'Status', 'Estimated Hours', 'Actual Hours', 'Billed Hours', 'Project Per Hour Rate', 'Task Per Hour Rate', 'Calculated Amount', 'Due Date', 'Artifacts'],
        TimeEntries: ['Time Entry ID', 'Project ID', 'Task ID', 'Date', 'Start Time', 'End Time', 'Duration', 'Description/Notes', 'User/Employee Name'],
        Activities: ['Activity ID', 'Timestamp', 'Type', 'Description', 'Entity ID', 'Entity Name', 'User Name', 'Metadata'],
        Users: ['Username', 'Password', 'Last Login']
      };
      
      headerTests.forEach((result, index) => {
        const sheetName = requiredSheets[index];
        if (result.status === 'fulfilled' && result.value.values && result.value.values[0]) {
          const actualHeaders = result.value.values[0];
          const expectedHeadersForSheet = expectedHeaders[sheetName as keyof typeof expectedHeaders];
          
          if (actualHeaders.length < expectedHeadersForSheet.length) {
            headerIssues.push(`${sheetName} sheet is missing some headers. Expected ${expectedHeadersForSheet.length}, found ${actualHeaders.length}.`);
          }
        } else if (result.status === 'rejected') {
          headerIssues.push(`Cannot read headers from ${sheetName} sheet.`);
        }
      });
      
      if (headerIssues.length > 0) {
        return {
          success: false,
          message: 'Header configuration issues found.',
          details: { headerIssues, expectedHeaders }
        };
      }
      
      return {
        success: true,
        message: `Google Sheets configuration is valid. Authentication mode: ${this.authMode}. ${this.authMode === 'service_account' ? 'Full read/write access available.' : 'Read-only access with API key.'}`,
        details: {
          spreadsheetTitle: spreadsheetInfo.properties?.title,
          worksheets: existingSheets,
          spreadsheetId: this.spreadsheetId,
          authMode: this.authMode,
          writeAccess: this.authMode === 'service_account'
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Configuration verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : error, authMode: this.authMode }
      };
    }
  }

  /**
   * Calculates duration between start and end times
   * Handles edge cases and validates input
   */
  calculateDuration(startTime: string, endTime: string): number {
    try {
      if (!startTime || !endTime) {
        throw new Error('Start time and end time are required');
      }
      
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid time format');
      }
      
      const diffMs = end.getTime() - start.getTime();
      
      if (diffMs < 0) {
        throw new Error('End time must be after start time');
      }
      
      return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 0;
    }
  }
}

export default GoogleSheetsService;