const fs = require('fs').promises;
const path = require('path');

class FileStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.questionsFile = path.join(this.dataDir, 'questions.json');
    this.answersFile = path.join(this.dataDir, 'answers.json');
    this.initialized = false;
  }

  // Initialize storage directory and files
  async initialize() {
    if (this.initialized) return;

    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize files if they don't exist
      await this.initializeFile(this.questionsFile, []);
      await this.initializeFile(this.answersFile, []);
      
      this.initialized = true;
      console.log('✅ File storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize file storage:', error);
      throw error;
    }
  }

  // Initialize a JSON file with default content if it doesn't exist
  async initializeFile(filePath, defaultContent) {
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), 'utf8');
        console.log(`📄 Created ${path.basename(filePath)}`);
      } else {
        throw error;
      }
    }
  }

  // Read JSON file with error handling
  async readJsonFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error reading ${path.basename(filePath)}:`, error);
      return [];
    }
  }

  // Write JSON file with backup and error handling
  async writeJsonFile(filePath, data) {
    try {
      // Create backup of existing file
      const backupPath = `${filePath}.backup`;
      try {
        await fs.copyFile(filePath, backupPath);
      } catch (error) {
        // Backup fails if original doesn't exist, which is fine
      }

      // Write new data with pretty formatting
      const jsonString = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, jsonString, 'utf8');
      
      // Remove backup after successful write
      try {
        await fs.unlink(backupPath);
      } catch (error) {
        // Ignore backup cleanup errors
      }
    } catch (error) {
      console.error(`❌ Error writing ${path.basename(filePath)}:`, error);
      
      // Try to restore from backup
      const backupPath = `${filePath}.backup`;
      try {
        await fs.copyFile(backupPath, filePath);
        console.log(`🔄 Restored ${path.basename(filePath)} from backup`);
      } catch (restoreError) {
        console.error(`❌ Failed to restore from backup:`, restoreError);
      }
      
      throw error;
    }
  }

  // QUESTIONS OPERATIONS

  async getAllQuestions() {
    await this.initialize();
    return await this.readJsonFile(this.questionsFile);
  }

  async saveQuestion(question) {
    await this.initialize();
    const questions = await this.getAllQuestions();
    questions.push(question);
    await this.writeJsonFile(this.questionsFile, questions);
    console.log(`💾 Saved question: ${question.id}`);
    return question;
  }

  async updateQuestion(questionId, updates) {
    await this.initialize();
    const questions = await this.getAllQuestions();
    const index = questions.findIndex(q => q.id === questionId);
    
    if (index === -1) {
      throw new Error(`Question ${questionId} not found`);
    }
    
    questions[index] = { ...questions[index], ...updates };
    await this.writeJsonFile(this.questionsFile, questions);
    console.log(`🔄 Updated question: ${questionId}`);
    return questions[index];
  }

  async getQuestionById(questionId) {
    const questions = await this.getAllQuestions();
    return questions.find(q => q.id === questionId);
  }

  async deleteQuestion(questionId) {
    await this.initialize();
    const questions = await this.getAllQuestions();
    const initialLength = questions.length;
    const filteredQuestions = questions.filter(q => q.id !== questionId);
    
    if (filteredQuestions.length === initialLength) {
      console.log(`⚠️ Question ${questionId} not found for deletion`);
      return false;
    }
    
    await this.writeJsonFile(this.questionsFile, filteredQuestions);
    console.log(`🗑️ Deleted question: ${questionId}`);
    return true;
  }

  // ANSWERS OPERATIONS

  async getAllAnswers() {
    await this.initialize();
    return await this.readJsonFile(this.answersFile);
  }

  async saveAnswer(answer) {
    await this.initialize();
    const answers = await this.getAllAnswers();
    answers.push(answer);
    await this.writeJsonFile(this.answersFile, answers);
    console.log(`💾 Saved answer: ${answer.id}`);
    return answer;
  }

  async getAnswerById(answerId) {
    const answers = await this.getAllAnswers();
    return answers.find(a => a.id === answerId);
  }

  // UTILITY OPERATIONS

  async getStats() {
    await this.initialize();
    const questions = await this.getAllQuestions();
    const answers = await this.getAllAnswers();
    
    return {
      questionsCount: questions.length,
      answersCount: answers.length,
      dataDirectory: this.dataDir,
      lastModified: {
        questions: await this.getFileModifiedTime(this.questionsFile),
        answers: await this.getFileModifiedTime(this.answersFile)
      }
    };
  }

  async getFileModifiedTime(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime;
    } catch (error) {
      return null;
    }
  }

  // Clear all data (useful for testing)
  async clearAll() {
    await this.initialize();
    await this.writeJsonFile(this.questionsFile, []);
    await this.writeJsonFile(this.answersFile, []);
    console.log('🗑️ Cleared all data');
  }
}

module.exports = FileStorage;