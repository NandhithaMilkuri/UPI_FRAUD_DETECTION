/**
 * Transaction Store (In-Memory Data Store)
 * Handles all data storage operations for transactions and historical tracking
 * Uses in-memory JavaScript objects and Sets for fast lookups
 */

// ============================================================================
// IN-MEMORY DATA STORES
// ============================================================================

// Store all transactions for historical analysis
// Structure: { transactionId, payer_id, payee_id, amount, timestamp, location, device_id, riskScore, riskLevel, reasons }
const allTransactions = [];

// Store flagged transactions (risk score > 0)
const flaggedTransactions = [];

// Track payer history for velocity checks
// Structure: { payer_id: { merchants: Set(), devices: Set(), transactionCount: number, lastTransactionTime: timestamp } }
const payerHistory = {};

// Track 1-minute window totals per payer
// Structure: { payer_id: [ { timestamp, amount } ] }
const oneMinuteWindows = {};

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/**
 * Add a transaction to the store
 * @param {Object} transaction - Transaction object
 * @returns {Object} - The stored transaction with ID
 */
function addTransaction(transaction) {
  allTransactions.push(transaction);
  
  if (transaction.riskScore >= 30) {
    flaggedTransactions.push(transaction);
  }
  
  return transaction;
}

/**
 * Get all transactions
 * @returns {Array} - All transactions
 */
function getAllTransactions() {
  return allTransactions;
}

/**
 * Get all flagged transactions
 * @returns {Array} - Flagged transactions only
 */
function getFlaggedTransactions() {
  return flaggedTransactions;
}

/**
 * Get transaction count
 * @returns {Object} - Counts for all and flagged transactions
 */
function getTransactionCounts() {
  return {
    total: allTransactions.length,
    flagged: flaggedTransactions.length
  };
}

// ============================================================================
// PAYER HISTORY OPERATIONS
// ============================================================================

/**
 * Get or create payer history
 * @param {string} payer_id - Payer identifier
 * @returns {Object} - Payer history object
 */
function getPayerHistory(payer_id) {
  if (!payerHistory[payer_id]) {
    payerHistory[payer_id] = {
      merchants: new Set(),
      devices: new Set(),
      transactionCount: 0,
      lastTransactionTime: null
    };
  }
  return payerHistory[payer_id];
}

/**
 * Update payer history after transaction
 * @param {string} payer_id - Payer identifier
 * @param {string} payee_id - Payee/Merchant identifier
 * @param {string} device_id - Device identifier
 * @param {string} timestamp - Transaction timestamp
 */
function updatePayerHistory(payer_id, payee_id, device_id, timestamp) {
  const history = getPayerHistory(payer_id);
  history.merchants.add(payee_id);
  history.devices.add(device_id);
  history.transactionCount++;
  history.lastTransactionTime = timestamp;
}

/**
 * Get recent transactions for velocity checks
 * @param {string} payer_id - Payer identifier
 * @param {string} timestamp - Current transaction timestamp
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Array} - Recent transactions within the window
 */
function getRecentTransactions(payer_id, timestamp, windowMs) {
  const windowStart = new Date(timestamp) - windowMs;
  return allTransactions.filter(t => 
    t.payer_id === payer_id && 
    new Date(t.timestamp) > windowStart
  );
}

// ============================================================================
// ONE-MINUTE WINDOW OPERATIONS
// ============================================================================

/**
 * Get total amount in 1-minute window
 * @param {string} payer_id - Payer identifier
 * @param {number} amount - Current transaction amount
 * @param {string} timestamp - Transaction timestamp
 * @param {number} windowMs - Window size in milliseconds
 * @returns {number} - Total amount in the window
 */
function getOneMinuteTotal(payer_id, amount, timestamp, windowMs) {
  // Initialize window tracker if not exists
  if (!oneMinuteWindows[payer_id]) {
    oneMinuteWindows[payer_id] = [];
  }
  
  // Clean old transactions (older than window)
  const windowStart = new Date(timestamp) - windowMs;
  oneMinuteWindows[payer_id] = oneMinuteWindows[payer_id].filter(
    t => new Date(t.timestamp) > windowStart
  );
  
  // Calculate total in current window
  const windowTotal = oneMinuteWindows[payer_id].reduce((sum, t) => sum + t.amount, 0) + amount;
  
  // Add current transaction to window
  oneMinuteWindows[payer_id].push({ timestamp, amount });
  
  return windowTotal;
}

// ============================================================================
// RESET OPERATIONS
// ============================================================================

/**
 * Reset all data stores
 * Clears all transactions, history, and windows
 */
function resetAll() {
  allTransactions.length = 0;
  flaggedTransactions.length = 0;
  Object.keys(payerHistory).forEach(key => delete payerHistory[key]);
  Object.keys(oneMinuteWindows).forEach(key => delete oneMinuteWindows[key]);
}

module.exports = {
  addTransaction,
  getAllTransactions,
  getFlaggedTransactions,
  getTransactionCounts,
  getPayerHistory,
  updatePayerHistory,
  getRecentTransactions,
  getOneMinuteTotal,
  resetAll
};
