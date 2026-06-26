// API Base URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const resetBtn = document.getElementById('resetBtn');
const flaggedTableBody = document.getElementById('flaggedTableBody');

// Stats Elements
const highRiskCount = document.getElementById('highRiskCount');
const mediumRiskCount = document.getElementById('mediumRiskCount');
const totalFlaggedCount = document.getElementById('totalFlaggedCount');

// Initialize timestamp with current date/time
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('timestamp').value = now.toISOString().slice(0, 16);
    
    // Load initial flagged transactions
    loadFlaggedTransactions();
});

// ============================================================================
// TRANSACTION SUBMISSION
// ============================================================================

transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Gather form data
    const formData = {
        payer_id: document.getElementById('payer_id').value,
        payee_id: document.getElementById('payee_id').value,
        amount: parseFloat(document.getElementById('amount').value),
        timestamp: new Date(document.getElementById('timestamp').value).toISOString(),
        location: document.getElementById('location').value || null,
        device_id: document.getElementById('device_id').value || null
    };
    
    try {
        // Submit transaction to API
        const response = await fetch(`${API_URL}/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Display evaluation result
            displayResult(result);

            // Alert if risk score exceeds the allowed threshold
            if (result.riskScore > 60) {
                alert('Alert: Risk score is above 75%. The risk score should be less than 75%.');
            }
            
            // Refresh dashboard if transaction was flagged
            if (result.riskScore > 0) {
                loadFlaggedTransactions();
            }
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error submitting transaction:', error);
        alert('Failed to submit transaction. Make sure the server is running.');
    }
});

// ============================================================================
// RESULT DISPLAY
// ============================================================================

function displayResult(result) {
    resultSection.classList.remove('hidden');
    
    const status = (result.status || result.riskLevel || 'SAFE').toUpperCase();
    const alertConfig = {
        SAFE: {
            className: 'safe',
            title: 'SAFE',
            icon: '✅',
            message: 'Transaction appears normal. No suspicious activity detected.'
        },
        MEDIUM_RISK: {
            className: 'medium-risk',
            title: 'MEDIUM_RISK',
            icon: '⚠️',
            message: 'Potentially suspicious transaction detected. Analyst review recommended.'
        },
        HIGH_RISK: {
            className: 'high-risk',
            title: 'HIGH_RISK',
            icon: '🚨',
            message: 'High Risk Alert! Immediate investigation recommended.'
        }
    };
    const config = alertConfig[status] || alertConfig.SAFE;
    const reasons = result.reasons && result.reasons.length > 0
        ? result.reasons
        : (result.triggeredRules || []).map(rule => rule.code);
    
    resultContent.innerHTML = `
        <div class="result-card ${config.className}">
            <div class="result-alert">
                <h3>${config.icon} ${config.title}</h3>
                <p>${config.message}</p>
            </div>
            <div class="result-meta">
                <div class="result-score">Risk Score: ${result.riskScore}/100</div>
                <div class="result-status">Status: ${status}</div>
            </div>
            <div class="result-rules">
                <h4>Triggered Fraud Reasons:</h4>
                ${reasons.length > 0 ? `
                    <ul class="reason-list">
                        ${reasons.map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                ` : '<p>No fraud reasons triggered.</p>'}
            </div>
        </div>
    `;
}

// ============================================================================
// DASHBOARD - LOAD FLAGGED TRANSACTIONS
// ============================================================================

async function loadFlaggedTransactions() {
    try {
        const response = await fetch(`${API_URL}/flagged`);
        const data = await response.json();
        
        if (data.success) {
            updateDashboard(data.transactions);
        }
    } catch (error) {
        console.error('Error loading flagged transactions:', error);
    }
}

function updateDashboard(transactions) {
    // Update stats
    const highRisk = transactions.filter(t => t.riskLevel === 'HIGH_RISK').length;
    const mediumRisk = transactions.filter(t => t.riskLevel === 'MEDIUM_RISK').length;
    
    highRiskCount.textContent = highRisk;
    mediumRiskCount.textContent = mediumRisk;
    totalFlaggedCount.textContent = transactions.length;
    
    // Update table
    if (transactions.length === 0) {
        flaggedTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">No flagged transactions yet</td>
            </tr>
        `;
        return;
    }
    
    // Sort by risk score (highest first) and then by time (most recent first)
    const sortedTransactions = [...transactions].sort((a, b) => {
        if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    flaggedTableBody.innerHTML = sortedTransactions.map(t => {
        const status = (t.riskLevel || 'SAFE').toUpperCase();
        const rowClass = status === 'HIGH_RISK' ? 'high-risk-row' : status === 'MEDIUM_RISK' ? 'medium-risk-row' : '';
        const reasons = t.reasons && t.reasons.length > 0
            ? t.reasons
            : (t.triggeredRules || []).map(r => r.code);

        return `
            <tr class="${rowClass}">
                <td><code>${t.transactionId}</code></td>
                <td>${t.payer_id}</td>
                <td>${t.payee_id}</td>
                <td>₹${t.amount.toLocaleString()}</td>
                <td><strong>${t.riskScore}</strong></td>
                <td><span class="risk-badge ${status.toLowerCase()}">${status}</span></td>
                <td>
                    ${reasons.map(reason => `
                        <span class="rule-code" style="font-size: 0.75rem; margin-right: 5px;">${reason}</span>
                    `).join('')}
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================================================
// DASHBOARD ACTIONS
// ============================================================================

refreshBtn.addEventListener('click', loadFlaggedTransactions);

exportBtn.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/export/csv`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flagged_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('Failed to export CSV');
    }
});

resetBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/reset`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Clear result section
            resultSection.classList.add('hidden');
            resultContent.innerHTML = '';
            
            // Reset form
            transactionForm.reset();
            
            // Reset timestamp to current time
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('timestamp').value = now.toISOString().slice(0, 16);
            
            // Refresh dashboard
            loadFlaggedTransactions();
            
            alert('All data has been reset successfully.');
        }
    } catch (error) {
        console.error('Error resetting data:', error);
        alert('Failed to reset data');
    }
});

// ============================================================================
// AUTO-REFRESH DASHBOARD
// ============================================================================

// Auto-refresh dashboard every 10 seconds to show near real-time updates
setInterval(loadFlaggedTransactions, 10000);
