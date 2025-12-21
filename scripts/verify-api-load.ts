try {
    console.log('Attempting to import pages/api/process...');
    const handlerModule = require('../pages/api/process');
    console.log('Successfully loaded handler module');
} catch (error) {
    console.error('Failed to load handler:', error);
}
