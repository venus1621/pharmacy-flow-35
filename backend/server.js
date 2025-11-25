const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');
const branchRoutes = require('./routes/branch.routes');
const medicineRoutes = require('./routes/medicine.routes');
const mainStockRoutes = require('./routes/mainStock.routes');
const branchStockRoutes = require('./routes/branchStock.routes');
const transactionRoutes = require('./routes/transaction.routes');
const stockTransferRoutes = require('./routes/stockTransfer.routes');
const alertRoutes = require('./routes/alert.routes');
const pharmacistAssignmentRoutes = require('./routes/pharmacistAssignment.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Gebeta Pharmacy API is running with MongoDB',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/main-stock', mainStockRoutes);
app.use('/api/branch-stock', branchStockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stock-transfers', stockTransferRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/pharmacist-assignments', pharmacistAssignmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

module.exports = app;
