/**
 * Fraud Detection Rules Service
 * Contains all rule-based fraud detection logic with reason codes
 * 
 * Reason Codes:
 * - R001: High amount transaction (>10000)
 * - R002: First time merchant with high amount (>5000)
 * - R003: High transaction velocity (>10 tx in 5 minutes)
 * - R004: High amount in 1-minute window (>10000)
 * - R005: Unusual hour transaction (midnight-5am)
 * - R006: Device change with new beneficiary
 */

const transactionStore = require('../data/transactionStore');

// ============================================================================
// FRAUD DETECTION RULES
// ============================================================================

/**
 * Rule 1: High Amount Transaction
 * Triggers if transaction amount > 10000
 * Weight: 25 points
 */
function checkHighAmount(amount) {
  const HIGH_AMOUNT_THRESHOLD = 10000;
  if (amount > HIGH_AMOUNT_THRESHOLD) {
    return {
      triggered: true,
      reasonCode: 'R001',
      reasonName: 'HIGH_AMOUNT',
      description: 'High amount transaction (>₹10,000)',
      weight: 25
    };
  }
  return { triggered: false };
}

/**
 * Rule 2: First Time Merchant with High Amount
 * Triggers if merchant is seen for first time AND amount > 5000
 * Weight: 20 points
 */
function checkFirstTimeMerchant(payer_id, payee_id, amount) {
  const FIRST_TIME_MERCHANT_THRESHOLD = 5000;
  
  const payerHistory = transactionStore.getPayerHistory(payer_id);
  const isFirstTimeMerchant = !payerHistory.merchants.has(payee_id);
  
  if (isFirstTimeMerchant && amount > FIRST_TIME_MERCHANT_THRESHOLD) {
    return {
      triggered: true,
      reasonCode: 'R002',
      reasonName: 'NEW_MERCHANT_HIGH_VALUE',
      description: 'First time merchant with high amount (>₹5,000)',
      weight: 20
    };
  }
  return { triggered: false };
}

/**
 * Rule 3: High Transaction Velocity
 * Triggers if >10 transactions within 5 minutes for same payer
 * Weight: 30 points
 */
function checkTransactionVelocity(payer_id, timestamp) {
  const VELOCITY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  const VELOCITY_THRESHOLD = 10;
  
  const recentTxns = transactionStore.getRecentTransactions(payer_id, timestamp, VELOCITY_WINDOW_MS);
  
  if (recentTxns.length >= VELOCITY_THRESHOLD) {
    return {
      triggered: true,
      reasonCode: 'R003',
      reasonName: 'HIGH_TRANSACTION_VELOCITY',
      description: `High transaction velocity (${recentTxns.length} tx in 5 minutes)`,
      weight: 30
    };
  }
  return { triggered: false };
}

/**
 * Rule 4: High Amount in 1-Minute Window
 * Triggers if total amount > 10000 within 1 minute
 * Weight: 25 points
 */
function checkOneMinuteTotal(payer_id, amount, timestamp) {
  const ONE_MINUTE_MS = 60 * 1000;
  const ONE_MINUTE_THRESHOLD = 10000;
  
  const windowTotal = transactionStore.getOneMinuteTotal(payer_id, amount, timestamp, ONE_MINUTE_MS);
  
  if (windowTotal > ONE_MINUTE_THRESHOLD) {
    return {
      triggered: true,
      reasonCode: 'R004',
      reasonName: 'HIGH_AMOUNT_ONE_MINUTE_WINDOW',
      description: `High amount in 1-minute window (₹${windowTotal})`,
      weight: 25
    };
  }
  return { triggered: false };
}

/**
 * Rule 5: Unusual Hour Transaction
 * Triggers if transaction occurs between midnight and 5 AM
 * Weight: 15 points
 */
function checkUnusualHour(timestamp) {
  const hour = new Date(timestamp).getHours();
  const UNUSUAL_START = 0; // Midnight
  const UNUSUAL_END = 5;   // 5 AM
  
  if (hour >= UNUSUAL_START && hour < UNUSUAL_END) {
    return {
      triggered: true,
      reasonCode: 'R005',
      reasonName: 'UNUSUAL_HOUR',
      description: 'Unusual hour transaction (midnight-5 AM)',
      weight: 15
    };
  }
  return { triggered: false };
}

/**
 * Rule 6: Device Change with New Beneficiary
 * Triggers if device is different from last used AND merchant is new
 * Weight: 20 points
 */
function checkDeviceChangeNewBeneficiary(payer_id, payee_id, device_id) {
  const payerHistory = transactionStore.getPayerHistory(payer_id);
  
  const isNewMerchant = !payerHistory.merchants.has(payee_id);
  const isDeviceChanged = payerHistory.devices.size > 0 && !payerHistory.devices.has(device_id);
  
  if (isNewMerchant && isDeviceChanged) {
    return {
      triggered: true,
      reasonCode: 'R006',
      reasonName: 'DEVICE_CHANGED_NEW_PAYEE',
      description: 'Device change paired with new beneficiary',
      weight: 20
    };
  }
  return { triggered: false };
}

// ============================================================================
// MAIN EVALUATION FUNCTION
// ============================================================================

function getAlertLevel(riskScore) {
  if (riskScore >= 60) {
    return {
      status: 'HIGH_RISK',
      message: '🚨 High Risk Alert! Immediate investigation recommended.'
    };
  }

  if (riskScore >= 30) {
    return {
      status: 'MEDIUM_RISK',
      message: '⚠️ Warning: Potentially suspicious transaction detected. Analyst review recommended.'
    };
  }

  return {
    status: 'SAFE',
    message: '✅ Transaction appears normal. No suspicious activity detected.'
  };
}

/**
 * Main Fraud Evaluation Function
 * Evaluates all rules and calculates weighted risk score (0-100)
 * @param {Object} transaction - Transaction object
 * @returns {Object} - Evaluation result with risk score, level, and triggered rules
 */
function evaluateTransaction(transaction) {
  const { payer_id, payee_id, amount, timestamp, device_id } = transaction;
  
  const triggeredRules = [];
  let totalWeight = 0;
  
  // Execute all fraud detection rules
  const rule1 = checkHighAmount(amount);
  if (rule1.triggered) {
    triggeredRules.push(rule1);
    totalWeight += rule1.weight;
  }
  
  const rule2 = checkFirstTimeMerchant(payer_id, payee_id, amount);
  if (rule2.triggered) {
    triggeredRules.push(rule2);
    totalWeight += rule2.weight;
  }
  
  const rule3 = checkTransactionVelocity(payer_id, timestamp);
  if (rule3.triggered) {
    triggeredRules.push(rule3);
    totalWeight += rule3.weight;
  }
  
  const rule4 = checkOneMinuteTotal(payer_id, amount, timestamp);
  if (rule4.triggered) {
    triggeredRules.push(rule4);
    totalWeight += rule4.weight;
  }
  
  const rule5 = checkUnusualHour(timestamp);
  if (rule5.triggered) {
    triggeredRules.push(rule5);
    totalWeight += rule5.weight;
  }
  
  const rule6 = checkDeviceChangeNewBeneficiary(payer_id, payee_id, device_id);
  if (rule6.triggered) {
    triggeredRules.push(rule6);
    totalWeight += rule6.weight;
  }
  
  // Calculate risk score (cap at 100)
  const riskScore = Math.min(totalWeight, 100);
  const alertLevel = getAlertLevel(riskScore);
  
  // Update payer history in store
  transactionStore.updatePayerHistory(payer_id, payee_id, device_id, timestamp);
  
  return {
    riskScore,
    riskLevel: alertLevel.status,
    status: alertLevel.status,
    alertMessage: alertLevel.message,
    triggeredRules: triggeredRules.map(r => ({
      code: r.reasonCode,
      description: r.description
    })),
    reasons: triggeredRules.map(r => r.reasonName)
  };
}

module.exports = {
  evaluateTransaction
};
