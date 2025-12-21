try {
    console.log('Attempting to import pages/api/process...');
    const handler = require('../pages/api/process');
    console.log('Successfully loaded handler:', handler);
} catch (error) {
    console.error('Failed to load handler:', error);
}
