
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

async function checkSheetData() {
    console.log('🔍 Checking Sheet Data...');

    // Auth logic (copied from lib)
    const credentialsEnv = GOOGLE_CREDENTIALS!;
    let authOptions: any = { scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] };
    try {
        authOptions.credentials = JSON.parse(credentialsEnv);
    } catch (e) {
        authOptions.keyFile = credentialsEnv;
    }
    const auth = new google.auth.GoogleAuth(authOptions);
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'WineList!A1:N5', // Check header + first 4 rows
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('⚠️ No data found.');
            return;
        }

        console.log('Header:', rows[0]);
        console.log('Row 2:', rows[1]);
        console.log('Row 3:', rows[2]);
        console.log('Row 4:', rows[3]);

    } catch (error: any) {
        console.error('❌ Error reading sheet:', error.message);
    }
}

checkSheetData();
