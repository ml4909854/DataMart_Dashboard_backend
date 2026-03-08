const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const productRoutes = require('./src/routes/productRoutes');
const logger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');
require('dotenv').config();

const app = express();

// Global Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
    origin:process.env.FRONTEND_URL, 
    credentials:true
})); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(logger); // Request logging

// Routes
app.use('/api/products', productRoutes);

// Health check (no middleware)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString() 
    });
});

// 404 handler - routes not found
app.use(notFound);

// Error handler - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/products`);
    console.log(`📝 Logger enabled - check console for requests`);
});