const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Question, Answer, dataStore } = require('../models/dataStore');
const LLMService = require('../services/llmService');

const router = express.Router();
const llmService = new LLMService();

// Store SSE clients
let sseClients = [];

// POST /api/questions - Submit a new question
router.post('/questions', async (req, res) => {
  try {
    const { userId, question, options = {} } = req.body;
    
    if (!userId || !question) {
      return res.status(400).json({ error: 'userId and question are required' });
    }

    // Extract validation preference from options
    const validationEnabled = options.validation === true; // Default to false (OFF)
    console.log(`🔍 Validation ${validationEnabled ? 'ENABLED' : 'DISABLED'} for question: ${question}`);

    // Create and save question
    const questionId = `q_${uuidv4()}`;
    const questionObj = new Question(questionId, userId, question);
    await dataStore.saveQuestion(questionObj);

    // Broadcast question created event
    broadcastSSE('question_received', { 
      questionId,
      question: questionObj,
      status: 'received',
      message: 'Question received, starting processing...' 
    });

    // Broadcast processing started
    broadcastSSE('processing_started', { 
      questionId,
      status: 'processing',
      message: 'Analyzing question and generating initial response...' 
    });

    // Generate answer using LLM
    const llmResponse = await llmService.generateExplanationAndVisualization(question, {
      validation: validationEnabled, // Pass validation preference to LLM service
      onProgress: (stage, message) => {
        // Map LLM stages to appropriate SSE event types
        let eventType = 'processing_progress'; // default
        
        switch(stage) {
          case 'validation_started':
            eventType = 'validation_started';
            break;
          case 'validation_completed':
          case 'validation_skipped':
            eventType = 'validation_completed';
            break;
          case 'llm_generation':
          case 'llm_response_received':
          case 'validation_unavailable':
          case 'completed':
          default:
            eventType = 'processing_progress';
            break;
        }
        
        // Send progress updates during LLM processing
        broadcastSSE(eventType, {
          questionId,
          stage,
          status: 'in_progress',
          message
        });
      }
    });
    
    // Broadcast completion
    broadcastSSE('processing_complete', { 
      questionId,
      status: 'complete',
      message: 'Response generated and validated successfully!' 
    });

    // Create and save answer
    const answerId = `a_${uuidv4()}`;
    const answerObj = new Answer(answerId, llmResponse.text, llmResponse.visualization);
    await dataStore.saveAnswer(answerObj);

    // Update question with answer ID
    await dataStore.updateQuestion(questionId, { answerId });

    // Broadcast answer created event
    broadcastSSE('answer_created', { answer: answerObj, questionId });

    res.json({
      questionId,
      answerId
    });

  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/questions - Fetch all questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await dataStore.getAllQuestions();
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/answers/:id - Get specific answer with visualization
router.get('/answers/:id', async (req, res) => {
  try {
    const answerId = req.params.id;
    const answer = await dataStore.getAnswerById(answerId);
    
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }
    
    res.json(answer);
  } catch (error) {
    console.error('Error fetching answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats - Get storage statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await dataStore.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/conversations - Clear all conversations
router.delete('/conversations', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Clear all data from storage
    await dataStore.clearAll();

    // Broadcast clear event to all connected clients
    broadcastSSE('conversations_cleared', { userId, timestamp: new Date() });

    console.log(`🗑️ All conversations cleared for user: ${userId}`);
    
    res.json({ 
      message: 'All conversations cleared successfully',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error clearing conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stream - SSE endpoint
router.get('/stream', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection confirmation
  res.write('data: {"type":"connected","message":"SSE connection established"}\n\n');

  // Store client
  const clientId = uuidv4();
  const client = { id: clientId, response: res };
  sseClients.push(client);

  // Remove client on disconnect
  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
    console.log(`SSE client ${clientId} disconnected`);
  });

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write('data: {"type":"heartbeat"}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Helper function to broadcast SSE events
function broadcastSSE(eventType, data) {
  const message = JSON.stringify({ type: eventType, ...data });
  
  console.log(`📤 Broadcasting ${eventType} to ${sseClients.length} clients:`, message);
  
  sseClients.forEach(client => {
    try {
      client.response.write(`data: ${message}\n\n`);
    } catch (error) {
      console.error('❌ Error sending SSE message:', error);
    }
  });
  
  console.log(`✅ Broadcasted ${eventType} to ${sseClients.length} clients`);
}

// POST /api/validate - Validate a visualization response
router.post('/validate', async (req, res) => {
  try {
    const { response, originalQuestion } = req.body;
    
    if (!response) {
      return res.status(400).json({ error: 'Response is required for validation' });
    }

    console.log('🔍 Validation request received');

    // Check if validation is available
    if (!llmService.isValidationAvailable()) {
      return res.status(503).json({ 
        error: 'Validation service unavailable',
        message: 'Validation engine is not initialized'
      });
    }

    // Quick validation check
    const quickValidation = await llmService.quickValidate(response);
    
    let validatedResponse = response;
    if (quickValidation.needsCorrection && originalQuestion) {
      console.log('🔧 Running full validation and correction...');
      validatedResponse = await llmService.validateResponse(response, originalQuestion);
    }

    res.json({
      success: true,
      validation: quickValidation,
      correctedResponse: validatedResponse,
      wasChanged: JSON.stringify(response) !== JSON.stringify(validatedResponse)
    });

  } catch (error) {
    console.error('❌ Validation API error:', error);
    res.status(500).json({ 
      error: 'Validation failed', 
      message: error.message 
    });
  }
});

// GET /api/validation-status - Check validation engine status
router.get('/validation-status', (req, res) => {
  res.json({
    available: llmService.isValidationAvailable(),
    engine: 'Google Gemini 2.5 Pro',
    features: [
      'Animation logic validation',
      'Visual design checks',
      'Educational value assessment',
      'Technical correctness verification',
      'Automatic error correction'
    ]
  });
});

module.exports = router;
