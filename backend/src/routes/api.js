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
    const { userId, question } = req.body;
    
    if (!userId || !question) {
      return res.status(400).json({ error: 'userId and question are required' });
    }

    // Create and save question
    const questionId = `q_${uuidv4()}`;
    const questionObj = new Question(questionId, userId, question);
    await dataStore.saveQuestion(questionObj);

    // Broadcast question created event
    broadcastSSE('question_created', { question: questionObj });

    // Generate answer using LLM
    const llmResponse = await llmService.generateExplanationAndVisualization(question);
    
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

module.exports = router;
