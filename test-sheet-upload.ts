
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testSheetUpload() {
    console.log('🧪 Testing Google Sheets Upload...');

    // Dynamic import to ensure process.env is populated
    const { saveWineToSheets } = await import('./lib/google-sheets');

    try {
        const result = await saveWineToSheets({
            'Name': 'Test Wine from CLI',
            'Vintage': 2024,
            'Region/Producer': 'Test Region',
            'Varietal(품종)': ['Cabernet', 'Merlot'],
            'Price': 50000,
            'Quantity': 1,
            'Store': 'Test Store',
            'Purchase date': '2024-12-21',
            'Status': 'In Stock',
            'Image': 'https://example.com/test.jpg'
        });

        console.log('✅ Upload Successful!', result);
    } catch (e) {
        console.error('❌ Upload Failed:', e);
    }
}

testSheetUpload();
