
import { Client } from '@notionhq/client';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
// Use existing Google credentials
const GOOGLE_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!NOTION_API_KEY || !NOTION_DATABASE_ID || !GOOGLE_SHEET_ID || !GOOGLE_CREDENTIALS) {
    console.error('❌ Missing required environment variables.');
    console.error('Required: NOTION_API_KEY, NOTION_DATABASE_ID, GOOGLE_SHEET_ID, GOOGLE_APPLICATION_CREDENTIALS');
    process.exit(1);
}

// Initialize Notion Client
// Initialize Notion Client
const notion = new Client({ auth: NOTION_API_KEY });
console.log('🔍 Notion Client Keys:', Object.keys(notion));
if (notion.databases) {
    console.log('🔍 Database Methods:', Object.keys(notion.databases));
} else {
    console.error('❌ notion.databases is undefined');
}

// Initialize Google Sheets Client
async function getGoogleSheetsClient() {
    const credentialsEnv = GOOGLE_CREDENTIALS!;
    let authOptions: any = {
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    };

    try {
        const creds = JSON.parse(credentialsEnv);
        authOptions.credentials = creds;
    } catch (e) {
        // Not valid JSON, assume it's a file path
        authOptions.keyFile = credentialsEnv;
    }

    const auth = new google.auth.GoogleAuth(authOptions);
    return google.sheets({ version: 'v4', auth });
}

// Type definitions for Mapping
interface SheetRow {
    Name: string;
    Vintage: number | string;
    RegionProducer: string;
    Varietal: string;
    Price: number | string;
    Quantity: number | string;
    Store: string;
    PurchaseDate: string;
    Status: string;
    Country: string;
    Appellation: string;
    Notes: string;
    ImageUrl: string;
    NotionId: string;
}

// Helper to extract text from RichText objects
function getText(richText: any[]): string {
    if (!richText || !Array.isArray(richText)) return '';
    return richText.map((t) => t.plain_text).join('');
}

// Helper to format raw ID to UUID
function formatUUID(id: string): string {
    if (id.length === 32) {
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
    }
    return id;
}

// 1. Fetch all pages from Notion (Using fetch directly)
async function fetchAllNotionPages() {
    console.log('📥 Fetching pages from Notion (via fetch)...');
    const pages: any[] = [];
    let cursor: string | undefined = undefined;

    const formattedDbId = formatUUID(NOTION_DATABASE_ID!);
    console.log(`🔍 Using Database ID: ${formattedDbId}`);

    do {
        const response = await fetch(`https://api.notion.com/v1/databases/${formattedDbId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                start_cursor: cursor,
                page_size: 100,
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ Notion API Error: ${response.status} ${response.statusText}`);
            console.error(text);
            throw new Error(`Notion API failed: ${text}`);
        }

        const data: any = await response.json();
        pages.push(...data.results);
        cursor = data.next_cursor || undefined;

        process.stdout.write(`   ...fetched ${pages.length} pages so far\r`);
    } while (cursor);

    console.log(`\n✅ Total Notion Pages Found: ${pages.length}`);
    return pages;
}

// 2. Transform Notion Page to Sheet Row
function transformPage(page: any): SheetRow {
    const props = page.properties;

    // Extract Image URL
    let imageUrl = '';
    if (props['Image']?.files?.length > 0) {
        const file = props['Image'].files[0];
        imageUrl = file.file?.url || file.external?.url || '';
    }

    // Map Fields
    return {
        Name: getText(props['Name']?.title),
        Vintage: props['Vintage']?.number || '',
        RegionProducer: getText(props['Region/Producer']?.rich_text),
        Varietal: props['Varietal(품종)']?.multi_select?.map((m: any) => m.name).join(', ') || '',
        Price: props['Price']?.number || '',
        Quantity: props['Quantity']?.number || 1,
        Store: getText(props['Store']?.rich_text),
        PurchaseDate: props['Purchase date']?.date?.start || '',
        Status: props['Status']?.select?.name === 'Consumed' ? 'Consumed' : 'In Stock', // Default to 'In Stock' if '재고' or other
        Country: props['Country(국가)']?.select?.name || '',
        Appellation: getText(props['Appellation(원산지명칭)']?.rich_text),
        Notes: getText(props['Notes(메모)']?.rich_text),
        ImageUrl: imageUrl,
        NotionId: page.id,
    };
}

// 3. Main Function
async function main() {
    try {
        const sheets = await getGoogleSheetsClient();

        // 1. Fetch
        const pages = await fetchAllNotionPages();

        // 2. Transform
        console.log('🔄 Transforming data...');
        const rows: string[][] = pages.map((page) => {
            const row = transformPage(page);
            return [
                row.Name,
                row.Vintage?.toString(),
                row.RegionProducer,
                row.Varietal,
                row.Price?.toString(),
                row.Quantity?.toString(),
                row.Store,
                row.PurchaseDate,
                row.Status === 'Consumed' ? 'Consumed' : 'In Stock', // Normalize Status
                row.Country,
                row.Appellation,
                row.Notes,
                row.ImageUrl,
                row.NotionId
            ];
        });

        // 3. Push to Sheets
        if (rows.length === 0) {
            console.log('⚠️ No data to migrate.');
            return;
        }

        console.log(`📤 Uploading ${rows.length} rows to Google Sheets...`);

        // Append to 'WineList!A2' (assuming headers are in A1)
        await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'WineList!A2',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: rows,
            },
        });

        console.log('✅ Migration Complete! check your spreadsheet.');

    } catch (error: any) {
        console.error('❌ Migration Failed:', error.message);
        if (error.response) {
            console.error('Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

main();
