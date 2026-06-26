/**
 * Transaction Routes
 * Defines all API endpoints for transaction operations
 */

const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');

// ============================================================================
// TRANSACTION ROUTES
// ============================================================================

/**
 * POST /api/transaction
 * Submit a UPI transaction for fraud evaluation
 */
router.post('/transaction', fraudController.submitTransaction);

/**
 * GET /api/flagged
 * Retrieve all flagged transactions
 */
router.get('/flagged', fraudController.getFlaggedTransactions);

/**
 * GET /api/transactions
 * Retrieve all transactions
 */
router.get('/transactions', fraudController.getAllTransactions);

/**
 * GET /api/export/csv
 * Export flagged transactions as CSV
 */
router.get('/export/csv', fraudController.exportCSV);

/**
 * DELETE /api/reset
 * Reset all data (for testing purposes)
 */
router.delete('/reset', fraudController.resetData);

module.exports = router;
