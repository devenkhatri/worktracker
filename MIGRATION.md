# Migration Guide: API Key to Service Account Authentication

This guide will help you upgrade from API key authentication to Service Account authentication for full write access to Google Sheets.

## Why Upgrade?

- **API Key**: Read-only access, suitable for dashboards and reports
- **Service Account**: Full read/write access, required for creating/updating data

## Migration Steps

### Step 1: Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to "IAM & Admin" → "Service Accounts"
4. Click "Create Service Account"
5. Fill in the details:
   - **Name**: `worktracker-service-account`
   - **Description**: `Service account for WorkTracker application`
6. Click "Create and Continue"
7. Skip role assignment (we'll handle permissions at the sheet level)
8. Click "Done"

### Step 2: Generate Service Account Key

1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Select "JSON" format
5. Click "Create" and download the JSON file
6. **Keep this file secure** - it contains your private credentials

### Step 3: Extract Credentials

From the downloaded JSON file, you need two values:

```json
{
  "client_email": "worktracker-service-account@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----\n"
}
```

### Step 4: Update Environment Variables

Replace your current `.env` configuration:

**Before (API Key):**
```env
GOOGLE_SHEETS_API_KEY=your_api_key_here
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

**After (Service Account):**
```env
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=worktracker-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

**Important Notes:**
- Remove the `GOOGLE_SHEETS_API_KEY` variable completely
- The private key must include the literal `\n` characters
- Wrap the private key in double quotes

### Step 5: Grant Sheet Access

1. Open your Google Sheet
2. Click "Share" in the top right
3. Add the service account email (from step 3)
4. Set permission to "Editor"
5. Uncheck "Notify people" (service accounts don't need notifications)
6. Click "Share"

### Step 6: Test the Migration

1. Restart your application:
   ```bash
   npm run dev
   ```

2. Check the console logs for authentication mode:
   ```
   Using Service Account authentication
   ```

3. Test write operations:
   - Create a new project
   - Add a task
   - Log time entry

4. Verify data appears in your Google Sheet

## Troubleshooting

### "Authentication failed" Error
- Check that the service account email is correct
- Verify the private key format (should include `\n` characters)
- Ensure no extra spaces or characters in environment variables

### "Permission denied" Error
- Confirm the service account has "Editor" access to your sheet
- Check that you're using the correct spreadsheet ID
- Verify the sheet is not protected or restricted

### "Invalid grant" Error
- The private key format is likely incorrect
- Ensure the private key includes the full header and footer
- Check for any missing or extra characters

### Private Key Format Issues

The private key should look like this in your `.env` file:
```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Rollback Plan

If you need to rollback to API key authentication:

1. Restore your original `.env` file:
   ```env
   GOOGLE_SHEETS_API_KEY=your_api_key_here
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
   ```

2. Remove Service Account variables:
   ```bash
   # Remove these lines from .env
   # GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=...
   # GOOGLE_SHEETS_PRIVATE_KEY=...
   ```

3. Restart the application

**Note**: After rollback, write operations will fail, but read operations will work.

## Security Best Practices

1. **Secure Storage**: Never commit the JSON key file to version control
2. **Environment Variables**: Store credentials in environment variables only
3. **Access Control**: Grant minimum necessary permissions (Editor for sheets)
4. **Key Rotation**: Regularly rotate service account keys
5. **Monitoring**: Monitor service account usage in Google Cloud Console

## Verification Checklist

- [ ] Service Account created in Google Cloud Console
- [ ] JSON key file downloaded and credentials extracted
- [ ] Environment variables updated with Service Account credentials
- [ ] API key environment variable removed
- [ ] Service account granted Editor access to Google Sheet
- [ ] Application restarted and logs show "Service Account authentication"
- [ ] Write operations (create project/task/time entry) work successfully
- [ ] Data appears correctly in Google Sheet

## Support

If you encounter issues during migration:

1. Check the application logs for specific error messages
2. Verify all environment variables are set correctly
3. Test the Google Sheets API access using the verification endpoint
4. Ensure the service account has proper permissions

For additional help, refer to the main README.md file or create an issue in the project repository.