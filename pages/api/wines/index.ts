
import type { NextApiRequest, NextApiResponse } from 'next';
import { getWines, updateWineStatus } from '@/lib/google-sheets';
import { createApiHandler, sendSuccess, sendError } from '@/lib/api-utils';

export default createApiHandler({
    GET: async (req, res) => {
        try {
            const wines = await getWines();
            // Filter for 'In Stock' only as per requirements
            const inStockWines = wines.filter(w => w.status === 'In Stock');
            sendSuccess(res, inStockWines);
        } catch (error: any) {
            console.error('Failed to fetch wines:', error);
            sendError(res, 'Failed to fetch wines', 500, error.message);
        }
    },

    PUT: async (req, res) => {
        try {
            const { rowNumber, status } = req.body;

            if (!rowNumber || !status) {
                return sendError(res, 'Missing rowNumber or status', 400);
            }

            await updateWineStatus(rowNumber, status);
            sendSuccess(res, { message: 'Status updated successfully', rowNumber, status });
        } catch (error: any) {
            console.error('Failed to update wine status:', error);
            sendError(res, 'Failed to update wine status', 500, error.message);
        }
    }
});
