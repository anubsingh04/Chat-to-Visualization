import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Submit a new question
  async submitQuestion(userId, question, options = {}) {
    try {
      const response = await this.api.post('/api/questions', {
        userId,
        question,
        options // Include options like validation preference
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting question:', error);
      throw error;
    }
  }

  // Get all questions
  async getQuestions() {
    try {
      const response = await this.api.get('/api/questions');
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  // Get specific answer by ID
  async getAnswer(answerId) {
    try {
      const response = await this.api.get(`/api/answers/${answerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching answer:', error);
      throw error;
    }
  }

  // Clear all conversations
  async clearAllConversations(userId) {
    try {
      const response = await this.api.delete('/api/conversations', {
        data: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing conversations:', error);
      throw error;
    }
  }

  // Create SSE connection for real-time updates
  createSSEConnection(onMessage, onError) {
    console.log('🔄 Creating SSE connection to:', `${API_BASE_URL}/api/stream`);
    const eventSource = new EventSource(`${API_BASE_URL}/api/stream`);
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection opened');
    };
    
    eventSource.onmessage = (event) => {
      try {
        console.log('📨 Raw SSE message received:', event.data);
        const data = JSON.parse(event.data);
        console.log('📨 Parsed SSE message:', data);
        onMessage(data);
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error, 'Raw data:', event.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      console.log('SSE readyState:', eventSource.readyState);
      if (onError) onError(error);
    };

    return eventSource;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

export default new ApiService();
