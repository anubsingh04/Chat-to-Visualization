# Chat-to-Visualization App

A system that explains scientific concepts with both text and interactive visualizations using AI. Features dual-AI architecture with Google Gemini for content generation and optional validation, real-time progress tracking, and responsive design.

## ✨ Features

- **🤖 Dual-AI System**: Uses Google Gemini 2.5 Pro for generation + optional validation
- **📊 Interactive Visualizations**: Creates JSON-based animations to visualize concepts
- **⚡ Real-time Updates**: Server-Sent Events for live progress tracking
- **🎮 Advanced Controls**: Play/pause, stop, loop, fullscreen, and responsive design
- **💾 Persistent Storage**: File-based JSON storage for questions, answers, and visualizations
- **🔧 User Controls**: Toggle validation on/off, responsive tooltips, chat history
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React + CSS3 animations + SSE
- **Storage**: File-based JSON storage (production-ready)
- **AI**: Google Gemini API (1.5 Pro + 2.5 Pro for validation)
- **Real-time**: Server-Sent Events (SSE)
- **Styling**: CSS3 with responsive design and animations

## 📁 Project Structure

```
chat-to-viz-app/
├── backend/                 # Node.js Express API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   │   └── api.js      # Main API routes with SSE
│   │   ├── services/       # Core business logic
│   │   │   ├── llmService.js      # Google Gemini integration
│   │   │   └── validationEngine.js # AI validation system
│   │   ├── models/         # Data models
│   │   │   └── dataStore.js       # File-based storage
│   │   └── storage/        # Storage utilities
|   |── .env.example            # Environment configuration template
│   ├── data/               # JSON storage files
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ChatPanel.js       # Main chat interface
│   │   │   ├── ChatHistory.js     # Conversation history
│   │   │   └── VisualizationCanvas.js # Animation display
│   │   ├── services/       # API communication
│   │   │   └── apiService.js      # Frontend API client
│   │   └── utils/          # Visualization engine
│   │       └── visualizationEngine.js # Canvas rendering
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### 📋 Installation Instructions

#### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/anubsingh04/Chat-to-Visualization.git

# Navigate to the project directory
cd Chat-to-Visualization
```

#### 2. Environment Configuration

```bash
# Navigate to backend folder
cd backend
# Copy the environment template
cp .env.example .env

# Edit the .env file with your configuration
# Required: Add your Google Gemini API key
```

**Edit `.env` file:**
```env
# Google Gemini API Configuration
GEMINI_API_KEY=your_actual_api_key_here

# Server Configuration (optional)
PORT=3001
NODE_ENV=development
```

**🔑 Getting a Gemini API Key:**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

#### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the backend server
npm start
```

The backend will start on `http://localhost:3001`

#### 4. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

The frontend will start on `http://localhost:3000`

### 🎯 Quick Start

1. **Clone & Setup**: Follow installation instructions above
2. **API Key**: Add your Gemini API key to `.env` file
3. **Start Services**: Run backend (`npm start`) then frontend (`npm start`)
4. **Open App**: Visit `http://localhost:3000`
5. **Ask Questions**: Try "Explain photosynthesis" or "How do waves propagate?"

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | - | ✅ Yes |
| `PORT` | Backend server port | 3001 | ❌ No |
| `NODE_ENV` | Environment mode | development | ❌ No |

### Application Features

- **🔄 AI Validation Toggle**: Enable/disable secondary AI validation (OFF by default)
- **📱 Responsive Design**: Automatically adapts to different screen sizes
- **🖥️ Fullscreen Mode**: Click notification banner for complete animation view
- **⏯️ Playback Controls**: Play, pause, loop, and progress tracking
- **💬 Chat History**: View and replay previous conversations with visualizations
## 🌐 API Endpoints

### Core API Routes
- `POST /api/questions` - Submit a new question with optional validation
- `GET /api/questions` - Fetch all stored questions
- `GET /api/answers/:id` - Get specific answer with visualization data
- `GET /api/stream` - Server-Sent Events endpoint for real-time progress updates

### Request/Response Examples

**Submit Question:**
```json
POST /api/questions
{
  "userId": "user123",
  "question": "How does photosynthesis work?",
  "options": {
    "validation": false  // Optional: enable AI validation
  }
}
```

**SSE Progress Events:**
```javascript
// Real-time progress events
{ event: "question_received", data: {...} }
{ event: "processing_started", data: {...} }
{ event: "processing_progress", data: {...} }
{ event: "validation_started", data: {...} }
{ event: "validation_completed", data: {...} }
{ event: "processing_complete", data: {...} }
```

## 🎓 Demo Questions

Try asking about these scientific concepts:

### 🔬 Physics
- "Explain Newton's Laws of Motion"
- "How do electromagnetic waves propagate?"
- "What happens during nuclear fusion?"
- "Demonstrate the photoelectric effect"

### 🌱 Biology
- "How does photosynthesis work?"
- "Explain DNA replication process"
- "What happens during mitosis?"
- "How do neurons transmit signals?"

### 🌍 Chemistry  
- "Show me atomic structure"
- "How do chemical bonds form?"
- "Explain the periodic table trends"
- "What is molecular orbital theory?"

### 🌌 Astronomy
- "Describe our solar system"
- "How are stars formed?"
- "What are black holes?"
- "Explain planetary motion"

## 🚨 Troubleshooting

### Common Issues

**❌ "GEMINI_API_KEY is required"**
- Solution: Add your API key to the `.env` file
- Check: Make sure `.env` file is in the root directory

**❌ "Cannot connect to backend"**
- Solution: Ensure backend is running on port 3001
- Check: `curl http://localhost:3001/api/questions`

**❌ "Visualization not loading"**
- Solution: Check browser console for errors
- Try: Refresh page or try a different question

**❌ "Module not found" errors**
- Solution: Run `npm install` in both frontend and backend directories
- Check: Node.js and npm versions meet requirements

### Performance Tips

- **🔄 Validation OFF**: Disable AI validation for faster responses
- **📱 Mobile**: Use fullscreen mode for better visualization viewing
- **🌐 Network**: Ensure stable internet connection for AI API calls

## 🔮 Advanced Features

### AI Validation System
- **Dual AI Architecture**: Primary generation + secondary validation
- **Quality Control**: Automatically improves and corrects AI responses
- **User Control**: Toggle validation on/off based on needs
- **Progress Tracking**: Real-time feedback during validation process

### Visualization Engine
- **Smart Bounds Detection**: Automatically prevents animation clipping
- **Responsive Canvas**: Adapts to different screen sizes
- **Animation Controls**: Play, pause, loop, and fullscreen modes
- **Touch Support**: Optimized for mobile and tablet devices

### Real-time Communication
- **Server-Sent Events**: Live progress updates during processing
- **State Management**: React-based progress tracking
- **Error Handling**: Comprehensive error recovery and user feedback

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- Google Gemini AI for powering the explanations and validations
- React team for the excellent frontend framework  
- Node.js community for the robust backend platform
- Contributors and testers who helped improve the application

---

**Made with ❤️ for science education and interactive learning**
