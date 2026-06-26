/**
 * Fraud Controller
 * Handles all transaction-related business logic and API responses
 */

const fraudRules = require('../services/fraudRules');
const transactionStore = require('../data/transactionStore');

// ============================================================================
// CONTROLLER FUNCTIONS
// ============================================================================

/**
 * Submit and evaluate a transaction
 * POST /api/transaction
 */
function submitTransaction(req, res) {
  try {
    const transaction = req.body;
    
    // Validate required fields
    if (!transaction.payer_id || !transaction.payee_id || !transaction.amount || !transaction.timestamp) {
      return res.status(400).json({ 
        error: 'Missing required fields: payer_id, payee_id, amount, timestamp' 
      });
    }
    
    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Evaluate transaction for fraud risk
    const evaluation = fraudRules.evaluateTransaction(transaction);
    
    // Create transaction record
    const transactionRecord = {
      transactionId,
      ...transaction,
      ...evaluation,
      evaluatedAt: new Date().toISOString()
    };
    
    // Store transaction
    transactionStore.addTransaction(transactionRecord);
    
    // Return evaluation result
    res.json({
      success: true,
      transactionId,
      ...evaluation
    });
    
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all flagged transactions
 * GET /api/flagged
 */
function getFlaggedTransactions(req, res) {
  const transactions = transactionStore.getFlaggedTransactions();
  res.json({
    success: true,
    count: transactions.length,
    transactions
  });
}

/**
 * Get all transactions
 * GET /api/transactions
 */
function getAllTransactions(req, res) {
  const transactions = transactionStore.getAllTransactions();
  res.json({
    success: true,
    count: transactions.length,
    transactions
  });
}

/**
 * Export flagged transactions as CSV
 * GET /api/export/csv
 */
function exportCSV(req, res) {
  const transactions = transactionStore.getFlaggedTransactions();
  
  if (transactions.length === 0) {
    return res.status(404).json({ error: 'No flagged transactions to export' });
  }
  
  // CSV headers
  const headers = [
    'Transaction ID',
    'Payer ID',
    'Payee ID',
    'Amount',
    'Timestamp',
    'Location',
    'Device ID',
    'Risk Score',
    'Risk Level',
    'Triggered Rules',
    'Evaluated At'
  ];
  
  // Convert transactions to CSV rows
  const rows = transactions.map(t => [
    t.transactionId,
    t.payer_id,
    t.payee_id,
    t.amount,
    t.timestamp,
    t.location || 'N/A',
    t.device_id || 'N/A',
    t.riskScore,
    t.riskLevel,
    t.triggeredRules.map(r => `${r.code}: ${r.description}`).join('; '),
    t.evaluatedAt
  ]);
  
  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=flagged_transactions.csv');
  res.send(csvContent);
}

/**
 * Reset all data
 * DELETE /api/reset
 */
function resetData(req, res) {
  transactionStore.resetAll();
  res.json({ success: true, message: 'All data reset' });
}

module.exports = {
  submitTransaction,
  getFlaggedTransactions,
  getAllTransactions,
  exportCSV,
  resetData
};
