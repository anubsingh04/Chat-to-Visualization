require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

class LLMService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo-key');
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  async generateExplanationAndVisualization(question) {
    const systemPrompt = `You are an expert science educator. Your task is to explain scientific concepts in simple, clear language and create visualization specifications.

When a user asks a scientific question, you must respond with a JSON object containing:
1. "text": A clear, simple explanation of the concept (2-3 sentences)
2. "visualization": A JSON specification for animating the concept

The visualization JSON should follow this structure:
{
  "id": "unique_id",
  "duration": milliseconds,
  "fps": 30,
  "layers": [
    {
      "id": "element_id",
      "type": "circle|arrow|text|line",
      "props": { initial properties },
      "animations": [
        {
          "property": "x|y|r|opacity|orbit",
          "from": start_value,
          "to": end_value,
          "start": start_time_ms,
          "end": end_time_ms,
          // For orbital motion:
          "centerX": center_x,
          "centerY": center_y,
          "radius": orbit_radius,
          "duration": full_orbit_time
        }
      ]
    }
  ]
}

Available shape types:
- circle: { x, y, r, fill }
- arrow: { x, y, dx, dy, color }
- text: { x, y, text, fontSize, color }
- line: { x1, y1, x2, y2, stroke }

Canvas size: 800x600px
Use colors like #3498db (blue), #e74c3c (red), #f39c12 (orange), #2ecc71 (green)

Example for "Newton's First Law":
{
  "text": "Newton's First Law states that an object will remain at rest or in uniform motion unless acted upon by an external force.",
  "visualization": {
    "id": "newtons_first_law",
    "duration": 4000,
    "fps": 30,
    "layers": [
      {
        "id": "ball",
        "type": "circle",
        "props": { "x": 100, "y": 300, "r": 20, "fill": "#3498db" },
        "animations": [
          { "property": "x", "from": 100, "to": 700, "start": 1000, "end": 4000 }
        ]
      },
      {
        "id": "force_arrow",
        "type": "arrow",
        "props": { "x": 80, "y": 300, "dx": 40, "dy": 0, "color": "#e74c3c" },
        "animations": [
          { "property": "opacity", "from": 0, "to": 1, "start": 800, "end": 1200 }
        ]
      }
    ]
  }
}`;

    try {
      // For demo purposes, if no API key, return mock data
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'demo-key') {
        return this.generateMockResponse(question);
      }

      const prompt = `${systemPrompt}

User Question: ${question}

Please respond with ONLY a valid JSON object (no markdown formatting or extra text) containing the explanation and visualization specification.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, '').trim();
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Fallback to mock response
      return this.generateMockResponse(question);
    }
  }

  generateMockResponse(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('newton') || lowerQuestion.includes('motion') || lowerQuestion.includes('force')) {
      return {
        text: "Newton's First Law states that an object will remain at rest or in uniform motion in a straight line unless acted upon by an external force. This is also known as the law of inertia.",
        visualization: {
          id: "newtons_first_law",
          duration: 5000,
          fps: 30,
          layers: [
            {
              id: "ball",
              type: "circle",
              props: { x: 100, y: 300, r: 20, fill: "#3498db" },
              animations: [
                { property: "x", from: 100, to: 600, start: 1500, end: 4500 }
              ]
            },
            {
              id: "force_arrow",
              type: "arrow",
              props: { x: 70, y: 300, dx: 50, dy: 0, color: "#e74c3c" },
              animations: [
                { property: "opacity", from: 0, to: 1, start: 1000, end: 1500 },
                { property: "opacity", from: 1, to: 0, start: 1500, end: 2000 }
              ]
            },
            {
              id: "label",
              type: "text",
              props: { x: 400, y: 100, text: "Object in motion stays in motion", fontSize: 16, color: "#2c3e50" },
              animations: []
            }
          ]
        }
      };
    }
    
    if (lowerQuestion.includes('solar') || lowerQuestion.includes('planet') || lowerQuestion.includes('sun')) {
      return {
        text: "The Solar System consists of the Sun at the center with planets orbiting around it due to gravitational pull. Earth is the third planet from the Sun.",
        visualization: {
          id: "solar_system",
          duration: 8000,
          fps: 30,
          layers: [
            {
              id: "sun",
              type: "circle",
              props: { x: 400, y: 300, r: 30, fill: "#f39c12" },
              animations: []
            },
            {
              id: "earth",
              type: "circle",
              props: { x: 300, y: 300, r: 12, fill: "#3498db" },
              animations: [
                { property: "orbit", centerX: 400, centerY: 300, radius: 100, duration: 6000 }
              ]
            },
            {
              id: "mars",
              type: "circle",
              props: { x: 250, y: 300, r: 8, fill: "#e74c3c" },
              animations: [
                { property: "orbit", centerX: 400, centerY: 300, radius: 150, duration: 8000 }
              ]
            }
          ]
        }
      };
    }
    
    if (lowerQuestion.includes('photosynthesis') || lowerQuestion.includes('plant') || lowerQuestion.includes('chlorophyll')) {
      return {
        text: "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen. Chlorophyll in leaves captures the sunlight energy.",
        visualization: {
          id: "photosynthesis",
          duration: 6000,
          fps: 30,
          layers: [
            {
              id: "leaf",
              type: "circle",
              props: { x: 400, y: 350, r: 40, fill: "#2ecc71" },
              animations: []
            },
            {
              id: "sun_rays",
              type: "line",
              props: { x1: 200, y1: 150, x2: 380, y2: 320, stroke: "#f39c12" },
              animations: [
                { property: "opacity", from: 0, to: 1, start: 0, end: 1000 }
              ]
            },
            {
              id: "co2",
              type: "text",
              props: { x: 300, y: 250, text: "CO₂", fontSize: 14, color: "#7f8c8d" },
              animations: [
                { property: "y", from: 200, to: 330, start: 1000, end: 2500 }
              ]
            },
            {
              id: "oxygen",
              type: "text",
              props: { x: 500, y: 350, text: "O₂", fontSize: 14, color: "#3498db" },
              animations: [
                { property: "x", from: 420, to: 550, start: 3000, end: 5000 }
              ]
            }
          ]
        }
      };
    }

    // Default response
    return {
      text: "This is an interesting scientific concept! Let me create a simple visualization to help explain it.",
      visualization: {
        id: "generic_concept",
        duration: 3000,
        fps: 30,
        layers: [
          {
            id: "main_element",
            type: "circle",
            props: { x: 400, y: 300, r: 30, fill: "#9b59b6" },
            animations: [
              { property: "r", from: 30, to: 50, start: 0, end: 1500 },
              { property: "r", from: 50, to: 30, start: 1500, end: 3000 }
            ]
          }
        ]
      }
    };
  }
}

module.exports = LLMService;
