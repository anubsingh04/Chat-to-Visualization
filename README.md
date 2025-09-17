# Chat-to-Visualization App

A system that explains scientific concepts with both text and interactive visualizations using AI.

## Features

- **AI-powered explanations**: Uses LLM to generate clear explanations of scientific concepts
- **Interactive visualizations**: Creates JSON-based animations to visualize concepts
- **Real-time updates**: Server-Sent Events for live chat experience
- **Play/Pause controls**: Interactive control over visualization animations
- **Persistent storage**: File-based JSON storage for questions, answers, and visualizations
- **Enhanced controls**: Play/pause, stop, loop, and fullscreen functionality

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: React + CSS3 animations
- **Storage**: File-based JSON storage (production-ready)
- **Real-time**: Server-Sent Events (SSE)
- **LLM**: Google Gemini API (configurable)

## Project Structure

```
chat-to-viz-app/
├── backend/           # Node.js Express API server
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # LLM service
│   │   └── models/    # Data models
│   └── package.json
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Getting Started

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## API Endpoints

- `POST /api/questions` - Submit a new question
- `GET /api/questions` - Fetch all questions
- `GET /api/answers/:id` - Get answer with visualization
- `GET /api/stream` - SSE endpoint for real-time updates

## Demo Questions

Try asking about:
- Newton's Laws of Motion
- Solar System
- Photosynthesis
- Wave propagation
- Atomic structure
