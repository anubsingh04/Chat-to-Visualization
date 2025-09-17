const FileStorage = require('../storage/fileStorage');

// Initialize file storage
const storage = new FileStorage();

// Data models remain the same for compatibility
class Question {
  constructor(id, userId, question, answerId = null) {
    this.id = id;
    this.userId = userId;
    this.question = question;
    this.answerId = answerId;
    this.createdAt = new Date();
  }
}

class Answer {
  constructor(id, text, visualization) {
    this.id = id;
    this.text = text;
    this.visualization = visualization;
    this.createdAt = new Date();
  }
}

// File-based storage operations
const dataStore = {
  // Question operations
  async getAllQuestions() {
    return await storage.getAllQuestions();
  },

  async saveQuestion(question) {
    return await storage.saveQuestion(question);
  },

  async updateQuestion(questionId, updates) {
    return await storage.updateQuestion(questionId, updates);
  },

  async getQuestionById(questionId) {
    return await storage.getQuestionById(questionId);
  },

  // Answer operations
  async getAllAnswers() {
    return await storage.getAllAnswers();
  },

  async saveAnswer(answer) {
    return await storage.saveAnswer(answer);
  },

  async getAnswerById(answerId) {
    return await storage.getAnswerById(answerId);
  },

  // Utility operations
  async getStats() {
    return await storage.getStats();
  },

  async clearAll() {
    return await storage.clearAll();
  }
};

// For backward compatibility, keep the old array exports but make them async getters
// This allows existing code to work with minimal changes
const questions = {
  async push(question) {
    return await dataStore.saveQuestion(question);
  },
  
  async find(predicate) {
    const allQuestions = await dataStore.getAllQuestions();
    return allQuestions.find(predicate);
  },

  async length() {
    const allQuestions = await dataStore.getAllQuestions();
    return allQuestions.length;
  }
};

const answers = {
  async push(answer) {
    return await dataStore.saveAnswer(answer);
  },
  
  async find(predicate) {
    const allAnswers = await dataStore.getAllAnswers();
    return allAnswers.find(predicate);
  },

  async length() {
    const allAnswers = await dataStore.getAllAnswers();
    return allAnswers.length;
  }
};

module.exports = {
  Question,
  Answer,
  questions,
  answers,
  dataStore // New file-based operations
};
