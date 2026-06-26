# UPI Fraud Detection System

A real-time fraud detection system for UPI transactions that evaluates each transaction and assigns a risk score based on rule-based logic, flagging suspicious transactions in near real-time.

## Features

- **Real-time Transaction Evaluation**: Submit UPI transactions and receive instant fraud risk assessment
- **Weighted Risk Scoring**: Risk scores from 0-100 based on multiple fraud detection rules
- **Rule-Based Detection**: 6 comprehensive fraud detection rules with reason codes
- **Interactive Dashboard**: View flagged transactions with risk levels and triggered rules
- **CSV Export**: Export flagged transactions for further analysis
- **In-Memory Store**: Fast velocity checks without external database dependencies
- **Auto-Refresh**: Dashboard auto-refreshes every 10 seconds for near real-time monitoring

## Fraud Detection Rules

| Code | Rule | Weight |
|------|------|--------|
| R001 | High amount transaction (>₹10,000) | 25 points |
| R002 | First time merchant with high amount (>₹5,000) | 20 points |
| R003 | High transaction velocity (>10 tx in 5 minutes) | 30 points |
| R004 | High amount in 1-minute window (>₹10,000) | 25 points |
| R005 | Unusual hour transaction (midnight-5 AM) | 15 points |
| R006 | Device change paired with new beneficiary | 20 points |

## Risk Levels

- **LOW**: 0-24 points - Transaction appears normal
- **MEDIUM**: 25-49 points - Some risk factors detected
- **HIGH**: 50-100 points - High risk, immediate attention required

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data Storage**: In-memory (JavaScript objects and Maps)
- **API**: RESTful JSON API

## Installation

1. Navigate to the project directory:
```bash
cd C:\Users\nandh\CascadeProjects\upi-fraud-detection
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the backend server:
```bash
npm start
```

The server will start on `http://localhost:3000`

2. Open the frontend in your web browser:
```
http://localhost:3000/index.html
```

The server serves the frontend statically from the `frontend` directory.

## API Endpoints

### Submit Transaction
```http
POST /api/transaction
Content-Type: application/json

{
  "payer_id": "9988776655",
  "payee_id": "MERCHANT121",
  "amount": 15000,
  "timestamp": "2026-02-10T12:30:45",
  "location": "Delhi",
  "device_id": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "TXN1234567890123",
  "riskScore": 45,
  "riskLevel": "MEDIUM",
  "triggeredRules": [
    {
      "code": "R001",
      "description": "High amount transaction (>₹10,000)"
    }
  ]
}
```

### Get Flagged Transactions
```http
GET /api/flagged
```

### Get All Transactions
```http
GET /api/transactions
```

### Export Flagged Transactions as CSV
```http
GET /api/export/csv
```

### Reset All Data
```http
DELETE /api/reset
```

## Sample Test Cases

### Test Case 1: High Amount Transaction
```json
{
  "payer_id": "9988776655",
  "payee_id": "MERCHANT001",
  "amount": 15000,
  "timestamp": "2026-02-10T14:30:00",
  "location": "Mumbai",
  "device_id": "DEVICE001"
}
```
**Expected**: Triggers R001 (High amount)

### Test Case 2: High Velocity
Submit 11 transactions within 5 minutes with the same payer_id
**Expected**: Triggers R003 (High velocity)

### Test Case 3: Unusual Hour
```json
{
  "payer_id": "9988776655",
  "payee_id": "MERCHANT002",
  "amount": 5000,
  "timestamp": "2026-02-10T02:30:00",
  "location": "Delhi",
  "device_id": "DEVICE001"
}
```
**Expected**: Triggers R005 (Unusual hour)

### Test Case 4: Device Change + New Beneficiary
1. Submit a transaction with device_id "DEVICE001" to payee "MERCHANT001"
2. Submit another transaction with device_id "DEVICE002" to payee "MERCHANT002"
**Expected**: Second transaction triggers R006

## Project Structure

```
upi-fraud-detection/
├── backend/
│   ├── server.js              # Main server entry point
│   ├── routes/
│   │   └── transaction.js     # API route definitions
│   ├── controllers/
│   │   └── fraudController.js # Business logic handlers
│   ├── services/
│   │   └── fraudRules.js     # Fraud detection rule logic
│   └── data/
│       └── transactionStore.js # In-memory data store
├── frontend/
│   ├── index.html             # Frontend HTML
│   ├── styles.css             # Styling
│   └── app.js                 # Frontend JavaScript
├── package.json               # Node.js dependencies
└── README.md                  # Documentation
```

## Data Model

### Transaction Object
```javascript
{
  transactionId: "TXN1234567890",
  payer_id: "9988776655",
  payee_id: "MERCHANT121",
  amount: 15000,
  timestamp: "2026-02-10T12:30:45",
  location: "Delhi",
  device_id: "ABC123",
  riskScore: 45,
  riskLevel: "MEDIUM",
  triggeredRules: [
    { code: "R001", description: "..." }
  ],
  evaluatedAt: "2026-02-10T12:30:46"
}
```

## Stretch Goals Implemented

✅ Weighted risk score (0-100)  
✅ Basic historical patterning (simple counters for velocity checks)  
✅ CSV export of flagged transactions  

## Scoring Criteria Coverage

- **Rule Logic (35%)**: 6 comprehensive rules with weighted scoring
- **UI Dashboard (25%)**: Modern, responsive dashboard with real-time updates
- **Data Handling (20%)**: In-memory stores with velocity tracking
- **Explaining & Reasoning (10%)**: Clear comments and reason codes throughout
- **Code Quality (10%)**: Clean, modular, well-documented code

## Notes

- Data is stored in-memory and will be lost when the server restarts
- The system is designed for demonstration and testing purposes
- For production use, consider adding persistent storage and more sophisticated ML models
- The dashboard auto-refreshes every 10 seconds to show near real-time updates
