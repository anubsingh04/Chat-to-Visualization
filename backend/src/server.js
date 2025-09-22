require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration for development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL,
      // Add your Railway frontend URL here once deployed
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Built-in Express JSON and URL-encoded parsers (replaces body-parser)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', apiRoutes);

// Health check endpoint for Railway deployment
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    gemini_configured: !!process.env.GEMINI_API_KEY
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chat-to-Visualization API Server',
    version: '1.0.0',
    storage: 'File System (JSON)',
    endpoints: {
      'POST /api/questions': 'Submit a new question',
      'GET /api/questions': 'Get all questions',
      'GET /api/answers/:id': 'Get answer by ID',
      'GET /api/stats': 'Get storage statistics',
      'GET /api/stream': 'SSE stream for real-time updates'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Chat-to-Viz API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 SSE Stream: http://localhost:${PORT}/api/stream`);
});

module.exports = app;
