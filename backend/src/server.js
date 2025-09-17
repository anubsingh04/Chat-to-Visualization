const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
