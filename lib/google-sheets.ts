import { google } from 'googleapis';
import { NotionWineProperties } from './utils/wine-data-helpers';
import { ReceiptData } from './notion';
import path from 'path';

// Configuration
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!GOOGLE_SHEET_ID) {
    console.warn('⚠️ GOOGLE_SHEET_ID is not set. Google Sheets integration will fail.');
}

async function getGoogleSheetsClient() {
    if (!GOOGLE_CREDENTIALS) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not set.');
    }

    const credentialsEnv = GOOGLE_CREDENTIALS;
    let authOptions: any = {
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    };

    try {
        // Try parsing as JSON first (Vercel env var)
        const creds = JSON.parse(credentialsEnv);
        authOptions.credentials = creds;
    } catch (e) {
        // If not JSON, assumes it's a file path (Local dev)
        // For Vercel, we must ensure the env var is the full JSON string.
        // In local dev, if it's a relative path, resolve it.
        if (!path.isAbsolute(credentialsEnv) && !credentialsEnv.startsWith('{')) {
            authOptions.keyFile = path.resolve(process.cwd(), credentialsEnv);
        } else {
            authOptions.keyFile = credentialsEnv;
        }
    }

    const auth = new google.auth.GoogleAuth(authOptions);
    return google.sheets({ version: 'v4', auth });
}

export async function saveWineToSheets(data: NotionWineProperties): Promise<{ id: string; url: string }> {
    if (process.env.NODE_ENV === 'development') {
        console.log('[Google Sheets] saveWineToSheets called with:', data);
    }

    const sheets = await getGoogleSheetsClient();

    // Map NotionWineProperties to Sheet Row Array
    // Headers: Name, Vintage, Producer, Country, Region, Appellation, Varietal, Price, Quantity, Store, Purchase Date, Status, Notes
    // Columns: A, B, C, D, E, F, G, H, I, J, K, L, M (13 columns)

    const row = [
        data.Name,
        data.Vintage || '',
        data.Producer || '',                                    // C: Producer
        data['Country(국가)'] || '',                             // D: Country (Moved up)
        data.Region || '',                                      // E: Region
        data['Appellation(원산지명칭)'] || '',                     // F: Appellation
        (data['Varietal(품종)'] || []).join(', '),              // G: Varietal
        data.Price || '',                                       // H: Price
        data.Quantity || 1,                                     // I: Quantity
        data.Store || '',                                       // J: Store
        data['Purchase date'] || new Date().toISOString().split('T')[0], // K: Purchase Date
        data.Status || 'In Stock',                              // L: Status
        data['Notes(메모)'] || ''                                // M: Notes
    ];

    if (process.env.NODE_ENV === 'development') {
        console.log('[Google Sheets] Mapped row data:', row);
    }

    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'WineList!A:M', // 13 columns: Name to Notes (Producer, Region 분리)
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS', // Ensure new rows are inserted
            requestBody: {
                values: [row]
            }
        });

        if (process.env.NODE_ENV === 'development') {
            console.log('[Google Sheets] API response:', response.data);
        }

        const updatedRange = response.data.updates?.updatedRange || '';
        // Extract row number from range (e.g. "WineList!A134:N134") to build a link
        // But direct link to row is hard without knowing the sheet GID and row index reliably.
        // For now, return the general sheet URL.

        return {
            id: updatedRange,
            url: `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}`
        };
    } catch (error: any) {
        console.error('❌ Google Sheets API Error:', error.message);
        throw new Error(`Failed to save to Google Sheets: ${error.message}`);
    }
}

export async function saveReceiptToSheets(receiptData: ReceiptData): Promise<any[]> {
    const results = [];

    for (const item of receiptData.items) {
        const wineData: NotionWineProperties = {
            'Name': item.name,
            'Vintage': item.vintage || null,
            'Producer': '',            // Not usually on receipt
            'Region': '',              // Not usually on receipt
            'Price': item.price,
            'Quantity': item.quantity,
            'Store': receiptData.store,
            'Purchase date': receiptData.date,
            'Status': 'In Stock',
            'Varietal(품종)': [],
            'Image': null, // Receipts might not have individual wine images
            'Country(국가)': undefined,
            'Appellation(원산지명칭)': undefined,
            'Notes(메모)': undefined
        };

        const result = await saveWineToSheets(wineData);
        results.push(result);
    }

    return results;
}
