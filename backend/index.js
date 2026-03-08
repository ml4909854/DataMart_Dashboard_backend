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

// ✅ FIXED CORS - Multiple origins allowed
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
].filter(Boolean); // Remove null/undefined

console.log('🔒 Allowed origins:', allowedOrigins);

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (Postman, curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Global Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(logger);

// ✅ Routes - /api/products prefix ke saath
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        cors: allowedOrigins,
        timestamp: new Date().toISOString() 
    });
});

// ✅ Root route - API info
app.get('/', (req, res) => {
    res.json({
        message: 'DataMart API Server',
        endpoints: {
            products: '/api/products',
            categories: '/api/products/categories',
            brands: '/api/products/brands',
            health: '/health'
        }
    });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/products`);
    console.log(`🔒 CORS allowed origins:`, allowedOrigins);
});