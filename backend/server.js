const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
const transactionRoutes = require('./routes/transaction');
app.use('/api', transactionRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`UPI Fraud Detection Server running on http://localhost:${PORT}`);
  console.log('API Endpoints:');
  console.log('  POST   /api/transaction  - Submit transaction for evaluation');
  console.log('  GET    /api/flagged      - Get flagged transactions');
  console.log('  GET    /api/transactions  - Get all transactions');
  console.log('  GET    /api/export/csv   - Export flagged transactions as CSV');
  console.log('  DELETE /api/reset        - Reset all data');
  console.log('\nFrontend available at: http://localhost:3000/index.html');
});
