require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ValidationEngine = require('./validationEngine');

class LLMService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo-key');
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    // Initialize validation engine
    try {
      this.validationEngine = new ValidationEngine();
      console.log('✅ Validation engine initialized');
    } catch (error) {
      console.warn('⚠️ Validation engine failed to initialize:', error.message);
      this.validationEngine = null;
    }
  }

  async generateExplanationAndVisualization(question, options = {}) {
    const { onProgress, validation = true } = options; // Default validation to true
    console.log(`🔍 Validation ${validation ? 'enabled' : 'disabled'} for LLM generation`);
    
    const systemPrompt = `You are an expert science educator with access to an advanced visualization engine. Create engaging explanations and stunning visualizations for any scientific question.

When a user asks a question, respond with a JSON object containing:
1. "text": A clear, engaging explanation (2-3 sentences)
2. "visualization": A creative animation that helps illustrate the concept

IMPORTANT: Use this exact format structure with CANVAS properties (NOT SVG):
{
  "text": "Your explanation",
  "visualization": {
    "id": "unique_id",
    "duration": 5000,
    "fps": 30,
    "layers": [
      {
        "id": "element_id",
        "type": "shape_type",
        "props": { "x": 100, "y": 100, "fill": "#color" },
        "animations": [...]
      }
    ]
  }
}

🎨 SHAPE TYPES & REQUIRED PROPERTIES:

🔵 circle: { x, y, r, fill?, stroke?, strokeWidth?, opacity? }
📦 rectangle: { x, y, width, height, fill?, stroke?, strokeWidth?, opacity? }
🥚 ellipse: { x, y, radiusX, radiusY, fill?, stroke?, strokeWidth?, opacity? }
📏 line: { x1, y1, x2, y2, stroke, strokeWidth?, opacity? }
➡️  arrow: { x, y, dx, dy, color?, opacity? }
📝 text: { x, y, text, fontSize?, color?, textAlign?, opacity? }
⭐ star: { x, y, outerRadius, innerRadius?, points?, fill?, stroke?, strokeWidth?, rotation?, opacity? }
🌀 spiral: { x, y, maxRadius, turns?, startAngle?, stroke?, strokeWidth?, opacity? }
🌙 arc: { x, y, radius, startAngle, endAngle, counterclockwise?, sector?, fill?, stroke?, strokeWidth?, opacity? }
📈 bezier: { startPoint: {x, y}, endPoint: {x, y}, controlPoint1?: {x, y}, controlPoint2?: {x, y}, stroke?, strokeWidth?, opacity? }
🔺 polygon: { points: [{x, y}, ...], fill?, stroke?, strokeWidth?, opacity? }
🌊 wave: { startX, startY, endX, amplitude, frequency, phase?, stroke?, strokeWidth?, opacity? }
🎨 gradient: { shape: "rectangle", type: "linear|radial", x, y, width?, height?, radius?, colorStops: [{offset: 0-1, color: "#hex"}], opacity? }
💫 particle: { particles: [{x, y, size, color?, opacity?}, ...], opacity? }

� ANIMATION PROPERTIES:
You can animate ANY property: x, y, r, width, height, opacity, rotation, fill, stroke, etc.

Special Animations:
- "orbit" property: Makes objects revolve in circles
  Example: { property: "orbit", centerX: 400, centerY: 200, radius: 100, duration: 3000, repeat: true }

🎯 ANIMATION FORMAT:
{
  "property": "property_name",
  "startValue": start,
  "endValue": end, 
  "duration": milliseconds,
  "delay": start_delay,
  "easing": "linear|ease-in|ease-out|ease-in-out|ease-in-cubic|ease-out-cubic|elastic|bounce",
  "repeat": true/false,
  "alternate": true/false
}

📐 COORDINATES: Use any range you want (0-100, 0-1000, etc.) - the engine auto-scales everything.

⚠️ IMPORTANT COLOR GUIDELINES:
• Canvas background is WHITE by default
• NEVER use white (#ffffff) colors for shapes or text - they'll be invisible!
• For dark themes (space, night scenes): Add a dark background rectangle first
• For light themes: Use dark colors for visibility

🎨 BACKGROUND RECOMMENDATIONS:
• Space scenes: { "type": "rectangle", "x": 0, "y": 0, "width": 800, "height": 400, "fill": "#0a0a0a" }
• Ocean scenes: { "type": "rectangle", "x": 0, "y": 0, "width": 800, "height": 400, "fill": "#1e3a8a" }
• Sky scenes: { "type": "rectangle", "x": 0, "y": 0, "width": 800, "height": 400, "fill": "#87ceeb" }
• Forest scenes: { "type": "rectangle", "x": 0, "y": 0, "width": 800, "height": 400, "fill": "#2d5016" }

📝 TEXT REQUIREMENTS - MANDATORY FOR ALL VISUALIZATIONS:
ALWAYS include text elements to explain and label your visualization!

Text Properties:
• text: { x, y, text, fontSize?, color?, textAlign?, opacity? }
• fontSize: Number (default: 16, range: 10-48 works best)
• color: Hex color (default: "#000000")
• textAlign: "left" | "center" | "right" (default: "left")
• x, y: Position coordinates
• opacity: 0.0-1.0 (default: 1.0)

Text Animation Examples:
{
  "type": "text",
  "x": 400, "y": 50,
  "text": "Solar System Animation",
  "fontSize": 24,
  "color": "#2c3e50",
  "textAlign": "center",
  "animations": [{
    "property": "opacity",
    "startValue": 0,
    "endValue": 1,
    "duration": 1000,
    "easing": "ease-out"
  }]
}

REQUIRED TEXT ELEMENTS:
1. TITLE: Main heading explaining the visualization (top center, fontSize: 20-24)
2. LABELS: Name/describe each major element (near each shape, fontSize: 12-16)
3. DESCRIPTIONS: Brief explanation of what's happening (bottom or side, fontSize: 14-18)
4. VALUES: Show numerical data when relevant (fontSize: 12-14)

Text Positioning Guidelines:
• Title: x: 400 (center), y: 30-50 (top)
• Labels: Position near each shape with 10-20px offset
• Descriptions: x: 50-750, y: 350-380 (bottom area)
• Values: Inside or adjacent to data elements

🎨 BE CREATIVE! 
- ALWAYS start with a background rectangle for better visibility
- Use vibrant colors (#3498db, #e74c3c, #f39c12, #2ecc71, #9b59b6)  
- AVOID white colors (#ffffff, #fff) - they're invisible on white canvas
- Combine multiple shapes and animations
- Use particles for dynamic effects (stars, bubbles, etc.)
- Add orbital motion for rotating systems
- Layer elements for depth
- Always include educational text explanations
- Make it visually appealing AND informative!

💡 COMPLETE EXAMPLE WITH PROPER BACKGROUND:
{
  "layers": [
    {
      "id": "background",
      "type": "rectangle",
      "props": {"x": 0, "y": 0, "width": 800, "height": 400, "fill": "#f8f9fa"}
    },
    {
      "id": "title",
      "type": "text", 
      "props": {"x": 400, "y": 30, "text": "Bouncing Ball Physics", "fontSize": 22, "color": "#2c3e50", "textAlign": "center"}
    },
    {
      "id": "ball",
      "type": "circle",
      "props": {"x": 100, "y": 200, "r": 25, "fill": "#e74c3c"},
      "animations": [{"property": "x", "startValue": 100, "endValue": 700, "duration": 2000, "repeat": true, "alternate": true}]
    },
    {
      "id": "ball_label", 
      "type": "text",
      "props": {"x": 80, "y": 160, "text": "Ball", "fontSize": 14, "color": "#c0392b"}
    },
    {
      "id": "description",
      "type": "text",
      "props": {"x": 50, "y": 360, "text": "The ball moves horizontally with smooth animation", "fontSize": 16, "color": "#34495e"}
    }
  ]
}

Canvas size: 800x400px (auto-scaled)`;

    try {
      // For demo purposes, if no API key, return mock data
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'demo-key') {
        return this.generateMockResponse(question);
      }

      // Progress: Starting LLM generation
      if (onProgress) onProgress('llm_generation', 'Sending question to AI for initial response...');

      const prompt = `${systemPrompt}

User Question: ${question}

Please respond with ONLY a valid JSON object (no markdown formatting or extra text) containing the explanation and visualization specification.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Progress: Initial response received
      if (onProgress) onProgress('llm_response_received', 'Initial response received, parsing and validating...');
      
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = text.replace(/```json\n?|\n?```/g, '').trim();
      
      let parsed = JSON.parse(cleanedResponse);
      
      // 🔍 VALIDATION STEP: Use validation engine to check and fix the response (if enabled)
      if (validation && this.validationEngine) {
        try {
          // Progress: Starting validation
          if (onProgress) onProgress('validation_started', 'Initial response generated! Running validation checks...');
          
          console.log('🔍 Running validation engine on LLM response...');
          const validatedResponse = await this.validationEngine.validateAndFix(parsed, question);
          parsed = validatedResponse;
          
          // Progress: Validation completed
          if (onProgress) onProgress('validation_completed', 'Validation completed! Applying final optimizations...');
          console.log('✅ Validation completed successfully');
        } catch (validationError) {
          console.warn('⚠️ Validation failed, using original response:', validationError.message);
          if (onProgress) onProgress('validation_skipped', 'Validation skipped, using original response...');
          // Continue with original response if validation fails
        }
      } else if (!validation) {
        console.log('🚫 Validation disabled by user preference, skipping validation');
        if (onProgress) onProgress('validation_skipped', 'Validation disabled by user preference...');
      } else {
        console.log('⚠️ Validation engine not available, skipping validation');
        if (onProgress) onProgress('validation_unavailable', 'Processing response without validation...');
      }
      
      // Transform format if LLM used 'elements' instead of 'layers'
      if (parsed.visualization && parsed.visualization.elements && !parsed.visualization.layers) {
        parsed.visualization.layers = parsed.visualization.elements;
        delete parsed.visualization.elements;
        
        // Ensure required top-level properties exist
        if (!parsed.visualization.id) {
          parsed.visualization.id = `viz_${Date.now()}`;
        }
        if (!parsed.visualization.duration) {
          parsed.visualization.duration = 5000;
        }
        if (!parsed.visualization.fps) {
          parsed.visualization.fps = 30;
        }
      }
      
      // Transform SVG coordinates to Canvas coordinates
      if (parsed.visualization && parsed.visualization.layers) {
        const transformedLayers = [];
        
        parsed.visualization.layers.forEach(layer => {
          if (!layer.props) {
            transformedLayers.push(layer);
            return;
          }
          
          // Transform cx, cy to x, y for circles
          if (layer.props.cx !== undefined) {
            layer.props.x = layer.props.cx;
            delete layer.props.cx;
          }
          if (layer.props.cy !== undefined) {
            layer.props.y = layer.props.cy;
            delete layer.props.cy;
          }
          
          // Transform SVG path 'd' attribute - for now, skip complex paths
          if (layer.type === 'path' && layer.props.d) {
            console.warn('Path elements with SVG d attribute are not supported. Converting to simple shapes.');
            layer.type = 'wave';
            layer.props = {
              startX: 0, endX: 800, startY: 200,
              amplitude: 50, frequency: 0.02,
              stroke: layer.props.stroke || '#3498db',
              strokeWidth: layer.props.strokeWidth || 3
            };
            delete layer.props.d;
          }
          
          // Transform wave properties to match engine expectations
          if (layer.type === 'wave' && layer.props.x !== undefined && layer.props.width !== undefined) {
            const startX = layer.props.x || 0;
            const width = layer.props.width || 800;
            const startY = layer.props.y || 200;
            
            layer.props.startX = startX;
            layer.props.endX = startX + width;
            layer.props.startY = startY;
            layer.props.amplitude = layer.props.amplitude || 20;
            layer.props.frequency = layer.props.frequency || 0.02;
            
            // Transform animations that reference old properties
            if (layer.animations) {
              layer.animations.forEach(animation => {
                if (animation.property === 'x') {
                  // Convert x animation to phase animation for wave movement
                  animation.property = 'phase';
                  animation.startValue = 0;
                  animation.endValue = Math.PI * 2; // Full wave cycle
                }
              });
            }
            
            // Clean up old properties
            delete layer.props.x;
            delete layer.props.y;
            delete layer.props.width;
            delete layer.props.height;
          }
          
          // Transform particle properties to individual circles
          if (layer.type === 'particle') {
            if (layer.props.count && layer.props.spread) {
              // Convert particle system to individual animated circles
              const count = Math.min(layer.props.count, 20); // Limit for performance
              const spread = layer.props.spread;
              const baseX = layer.props.x || 0;
              const baseY = layer.props.y || 200;
              
              // Create individual circle layers for each particle
              for (let i = 0; i < count; i++) {
                const particleX = baseX + (Math.random() * spread);
                const particleY = baseY + (Math.random() * 40 - 20);
                
                transformedLayers.push({
                  id: `${layer.id}_particle_${i}`,
                  type: 'circle',
                  props: {
                    x: particleX,
                    y: particleY,
                    r: layer.props.r || 3,
                    fill: layer.props.fill || '#e74c3c'
                  },
                  animations: layer.animations ? layer.animations.map(anim => ({
                    ...anim,
                    delay: (anim.delay || 0) + i * 50 // Stagger animations
                  })) : []
                });
              }
              return; // Skip adding the original particle layer
            }
          }
          
          // Add the original layer (possibly transformed)
          transformedLayers.push(layer);
        });
        
        // Replace layers with transformed layers
        parsed.visualization.layers = transformedLayers;
      }
      
      // Progress: Final completion
      if (onProgress) onProgress('completed', 'Response ready! Loading visualization...');
      
      return parsed;
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Fallback to mock response
      return this.generateMockResponse(question);
    }
  }

  generateMockResponse(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('wave') || lowerQuestion.includes('propagat')) {
      return {
        text: "Waves propagate by transferring energy through a medium without the actual movement of the medium itself. Think of it like a domino effect – each domino falls (transfers energy), but stays in roughly the same location.",
        visualization: {
          id: "wave_propagation_demo",
          duration: 6000,
          fps: 30,
          layers: [
            // Background
            {
              id: "background",
              type: "rectangle",
              props: {
                x: 0, y: 0, width: 800, height: 400,
                fill: "#2c3e50"
              },
              animations: []
            },
            // Wave particles showing oscillation
            {
              id: "particle_1",
              type: "circle",
              props: { 
                x: 100, y: 200, r: 8, 
                fill: "#3498db", stroke: "#2980b9", strokeWidth: 2
              },
              animations: [
                {
                  property: "y",
                  startValue: 200,
                  endValue: 150,
                  duration: 2000,
                  easing: "easeInOutQuad",
                  repeat: true,
                  alternate: true
                }
              ]
            },
            {
              id: "particle_2",
              type: "circle",
              props: { 
                x: 200, y: 200, r: 8, 
                fill: "#3498db", stroke: "#2980b9", strokeWidth: 2
              },
              animations: [
                {
                  property: "y",
                  startValue: 200,
                  endValue: 250,
                  duration: 2000,
                  delay: 500,
                  easing: "easeInOutQuad",
                  repeat: true,
                  alternate: true
                }
              ]
            },
            {
              id: "particle_3",
              type: "circle",
              props: { 
                x: 300, y: 200, r: 8, 
                fill: "#3498db", stroke: "#2980b9", strokeWidth: 2
              },
              animations: [
                {
                  property: "y",
                  startValue: 200,
                  endValue: 150,
                  duration: 2000,
                  delay: 1000,
                  easing: "easeInOutQuad",
                  repeat: true,
                  alternate: true
                }
              ]
            },
            {
              id: "particle_4",
              type: "circle",
              props: { 
                x: 400, y: 200, r: 8, 
                fill: "#3498db", stroke: "#2980b9", strokeWidth: 2
              },
              animations: [
                {
                  property: "y",
                  startValue: 200,
                  endValue: 250,
                  duration: 2000,
                  delay: 1500,
                  easing: "easeInOutQuad",
                  repeat: true,
                  alternate: true
                }
              ]
            },
            {
              id: "particle_5",
              type: "circle",
              props: { 
                x: 500, y: 200, r: 8, 
                fill: "#3498db", stroke: "#2980b9", strokeWidth: 2
              },
              animations: [
                {
                  property: "y",
                  startValue: 200,
                  endValue: 150,
                  duration: 2000,
                  delay: 2000,
                  easing: "easeInOutQuad",
                  repeat: true,
                  alternate: true
                }
              ]
            },
            // Energy indicator moving along
            {
              id: "energy_pulse",
              type: "circle",
              props: { 
                x: 50, y: 200, r: 15, 
                fill: "#e74c3c", opacity: 0.7
              },
              animations: [
                {
                  property: "x",
                  startValue: 50,
                  endValue: 750,
                  duration: 5000,
                  easing: "linear",
                  repeat: true
                },
                {
                  property: "opacity",
                  startValue: 0.7,
                  endValue: 0.3,
                  duration: 500,
                  easing: "easeInOutQuad",
                  repeat: true,
                  alternate: true
                }
              ]
            },
            // Title
            {
              id: "title",
              type: "text",
              props: { 
                x: 400, y: 100, 
                text: "Wave Energy Propagation", 
                fontSize: 22, 
                color: "#ecf0f1"
              },
              animations: [
                {
                  property: "opacity",
                  startValue: 0,
                  endValue: 1,
                  duration: 1000,
                  delay: 1000,
                  easing: "easeOutQuad"
                }
              ]
            }
          ]
        }
      };
    }
    
    if (lowerQuestion.includes('newton') || lowerQuestion.includes('motion') || lowerQuestion.includes('force')) {
      return {
        text: "Newton's First Law states that an object will remain at rest or in uniform motion unless acted upon by an external force. This animation shows a ball moving at constant velocity after being pushed.",
        visualization: {
          id: "newtons_first_law",
          duration: 6000,
          fps: 30,
          layers: [
            // Background
            {
              id: "background",
              type: "rectangle",
              props: {
                x: 0, y: 0, width: 800, height: 400,
                fill: "#2c3e50"
              },
              animations: []
            },
            // Moving ball - simple linear motion
            {
              id: "ball",
              type: "circle",
              props: { 
                x: 100, y: 200, r: 25, 
                fill: "#3498db", stroke: "#2980b9", strokeWidth: 3
              },
              animations: [
                {
                  property: "x",
                  startValue: 100,
                  endValue: 700,
                  duration: 4000,
                  delay: 1000,
                  easing: "linear",
                  repeat: false
                }
              ]
            },
            // Force arrow (appears briefly)
            {
              id: "force_indicator",
              type: "rectangle",
              props: { 
                x: 50, y: 190, width: 40, height: 8,
                fill: "#e74c3c"
              },
              animations: [
                {
                  property: "opacity",
                  startValue: 0,
                  endValue: 1,
                  duration: 500,
                  delay: 500,
                  easing: "easeOutQuad"
                },
                {
                  property: "opacity",
                  startValue: 1,
                  endValue: 0,
                  duration: 500,
                  delay: 1000,
                  easing: "easeInQuad"
                }
              ]
            },
            // Text label
            {
              id: "label",
              type: "text",
              props: { 
                x: 400, y: 100, 
                text: "Constant Velocity Motion", 
                fontSize: 20, 
                color: "#ecf0f1"
              },
              animations: [
                {
                  property: "opacity",
                  startValue: 0,
                  endValue: 1,
                  duration: 1000,
                  delay: 2000,
                  easing: "easeOutQuad"
                }
              ]
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
            // Space background with gradient
            {
              id: "space",
              type: "gradient",
              props: {
                shape: "rectangle",
                type: "radial",
                x: 400, y: 200, radius: 300,
                width: 800, height: 400,
                colorStops: [
                  {offset: 0, color: "#2c3e50"},
                  {offset: 0.7, color: "#34495e"},
                  {offset: 1, color: "#1a252f"}
                ]
              },
              animations: []
            },
            // Sun with glow effect
            {
              id: "sun_glow",
              type: "gradient",
              props: {
                shape: "circle",
                type: "radial",
                x: 400, y: 200, radius: 50,
                colorStops: [
                  {offset: 0, color: "#f39c12"},
                  {offset: 0.6, color: "#e67e22"},
                  {offset: 1, color: "rgba(243, 156, 18, 0)"}
                ]
              },
              animations: [
                {
                  property: "radius",
                  startValue: 45,
                  endValue: 55,
                  duration: 2000,
                  easing: "easeInOutQuad",
                  alternate: true,
                  repeat: true
                }
              ]
            },
            // Sun core
            {
              id: "sun",
              type: "circle",
              props: { x: 400, y: 200, r: 25, fill: "#f1c40f", stroke: "#e67e22", strokeWidth: 2 },
              animations: []
            },
            // Mercury - fast inner orbit
            {
              id: "mercury",
              type: "circle",
              props: { x: 450, y: 200, r: 4, fill: "#95a5a6" },
              animations: [
                {
                  property: "orbit",
                  centerX: 400,
                  centerY: 200,
                  radius: 50,
                  duration: 2000,
                  repeat: true,
                  easing: "linear"
                }
              ]
            },
            // Earth - medium orbit
            {
              id: "earth",
              type: "circle",
              props: { x: 500, y: 200, r: 8, fill: "#3498db", stroke: "#27ae60", strokeWidth: 1 },
              animations: [
                {
                  property: "orbit",
                  centerX: 400,
                  centerY: 200,
                  radius: 100,
                  duration: 4000,
                  repeat: true,
                  easing: "linear"
                }
              ]
            },
            // Mars - slower outer orbit
            {
              id: "mars",
              type: "circle",
              props: { x: 550, y: 200, r: 6, fill: "#e74c3c" },
              animations: [
                {
                  property: "orbit",
                  centerX: 400,
                  centerY: 200,
                  radius: 150,
                  duration: 6000,
                  repeat: true,
                  easing: "linear"
                }
              ]
            },
            // Orbital paths as dashed circles
            {
              id: "earth_orbit",
              type: "arc",
              props: { 
                x: 400, y: 200, radius: 100, 
                startAngle: 0, endAngle: 6.28,
                stroke: "#7f8c8d", strokeWidth: 1, opacity: 0.4
              },
              animations: []
            },
            // Stars as particles
            {
              id: "stars",
              type: "particle",
              props: {
                particles: Array.from({length: 30}, () => ({
                  x: Math.random() * 800,
                  y: Math.random() * 400,
                  size: Math.random() * 2 + 1,
                  color: "#ecf0f1",
                  opacity: Math.random() * 0.8 + 0.2
                }))
              },
              animations: []
            }
          ]
        }
      };
    }
    
    if (lowerQuestion.includes('photosynthesis') || lowerQuestion.includes('plant') || lowerQuestion.includes('chlorophyll')) {
      return {
        text: "Photosynthesis converts sunlight, CO₂, and water into glucose and oxygen. This visualization shows the process: yellow light particles energize green chloroplasts, CO₂ and H₂O molecules enter, and glucose (blue) and oxygen (white) are produced.",
        visualization: {
          id: "photosynthesis_process",
          duration: 8000,
          fps: 30,
          layers: [
            // Background gradient (representing plant cell environment)
            {
              id: "cell_background",
              type: "gradient",
              props: {
                shape: "rectangle",
                type: "radial",
                x: 400, y: 200, radius: 300,
                colorStops: [
                  {offset: 0, color: "#d5f4e6"},
                  {offset: 1, color: "#27ae60"}
                ]
              }
            },
            // Chloroplast (where photosynthesis occurs)
            {
              id: "chloroplast",
              type: "ellipse",
              props: { 
                x: 400, y: 200, radiusX: 120, radiusY: 80, 
                fill: "#2ecc71", stroke: "#27ae60", strokeWidth: 3,
                opacity: 0.8
              },
              animations: [
                {
                  property: "opacity",
                  startValue: 0.8,
                  endValue: 1.0,
                  duration: 1000,
                  easing: "easeInOutQuad",
                  repeat: true,
                  alternate: true
                }
              ]
            },
            // Sun (light source)
            {
              id: "sun",
              type: "star",
              props: { 
                x: 100, y: 60, outerRadius: 30, innerRadius: 18,
                points: 12, fill: "#f1c40f", stroke: "#f39c12", strokeWidth: 2
              },
              animations: [
                {
                  property: "rotation",
                  startValue: 0,
                  endValue: 6.28,
                  duration: 3000,
                  easing: "linear",
                  repeat: true
                }
              ]
            },
            // Light photons traveling to chloroplast
            {
              id: "photons",
              type: "particle",
              props: {
                particles: Array.from({length: 15}, (_, i) => ({
                  x: 130 + i * 20,
                  y: 60 + Math.sin(i * 0.4) * 15,
                  size: 4,
                  color: "#f1c40f",
                  opacity: 0.9
                }))
              },
              animations: [
                {
                  property: "opacity",
                  startValue: 0.3,
                  endValue: 1.0,
                  duration: 500,
                  delay: i => i * 100,
                  easing: "easeInQuad",
                  repeat: true
                }
              ]
            },
            // CO₂ molecules entering
            {
              id: "co2_molecules",
              type: "particle",
              props: {
                particles: [
                  {x: 50, y: 120, size: 8, color: "#95a5a6", opacity: 0.8},
                  {x: 80, y: 140, size: 8, color: "#95a5a6", opacity: 0.8},
                  {x: 110, y: 160, size: 8, color: "#95a5a6", opacity: 0.8}
                ]
              },
              animations: [
                {
                  property: "x",
                  startValue: 50,
                  endValue: 350,
                  duration: 2500,
                  delay: i => i * 300,
                  easing: "easeInOutQuad"
                }
              ]
            },
            // H₂O molecules entering
            {
              id: "h2o_molecules",
              type: "particle",
              props: {
                particles: [
                  {x: 50, y: 280, size: 6, color: "#3498db", opacity: 0.8},
                  {x: 80, y: 300, size: 6, color: "#3498db", opacity: 0.8},
                  {x: 110, y: 320, size: 6, color: "#3498db", opacity: 0.8}
                ]
              },
              animations: [
                {
                  property: "x",
                  startValue: 50,
                  endValue: 350,
                  duration: 2000,
                  delay: i => i * 200,
                  easing: "easeInOutQuad"
                }
              ]
            },
            // Glucose production (blue particles leaving)
            {
              id: "glucose_output",
              type: "particle",
              props: {
                particles: [
                  {x: 450, y: 180, size: 10, color: "#2980b9", opacity: 0},
                  {x: 460, y: 200, size: 10, color: "#2980b9", opacity: 0},
                  {x: 440, y: 220, size: 10, color: "#2980b9", opacity: 0}
                ]
              },
              animations: [
                {
                  property: "x",
                  startValue: 450,
                  endValue: 700,
                  duration: 2000,
                  delay: 3000,
                  easing: "easeOutQuad"
                },
                {
                  property: "opacity",
                  startValue: 0,
                  endValue: 1,
                  duration: 500,
                  delay: 3000,
                  easing: "easeOutQuad"
                }
              ]
            },
            // Oxygen bubbles (white particles floating up)
            {
              id: "oxygen_bubbles",
              type: "particle",
              props: {
                particles: Array.from({length: 6}, (_, i) => ({
                  x: 400 + Math.cos(i) * 20,
                  y: 140,
                  size: 5,
                  color: "#ecf0f1",
                  opacity: 0
                }))
              },
              animations: [
                {
                  property: "y",
                  startValue: 140,
                  endValue: 20,
                  duration: 2500,
                  delay: i => 3500 + i * 200,
                  easing: "easeOutQuad"
                },
                {
                  property: "opacity",
                  startValue: 0,
                  endValue: 1,
                  duration: 300,
                  delay: i => 3500 + i * 200,
                  easing: "easeOutQuad"
                }
              ]
            },
            // Chemical equation text
            {
              id: "equation",
              type: "text",
              props: { 
                x: 400, y: 350, 
                text: "6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂", 
                fontSize: 14, color: "#2c3e50",
                opacity: 0
              },
              animations: [
                {
                  property: "opacity",
                  startValue: 0,
                  endValue: 1,
                  duration: 1000,
                  delay: 5000,
                  easing: "easeInQuad"
                }
              ]
            }
          ]
        }
      };
    }

    // Default response with advanced shapes
    return {
      text: "This is an interesting scientific concept! Let me create a dynamic visualization to help explain it.",
      visualization: {
        id: "generic_concept",
        duration: 4000,
        fps: 30,
        layers: [
          // Animated gradient background
          {
            id: "background",
            type: "gradient",
            props: {
              shape: "rectangle",
              type: "radial",
              x: 400, y: 200, radius: 200,
              width: 800, height: 400,
              colorStops: [
                {offset: 0, color: "#667eea"},
                {offset: 1, color: "#764ba2"}
              ]
            },
            animations: [
              {
                property: "radius",
                startValue: 200,
                endValue: 300,
                duration: 2000,
                easing: "easeInOutQuad",
                alternate: true,
                repeat: true
              }
            ]
          },
          // Central pulsing element
          {
            id: "main_element",
            type: "star",
            props: { 
              x: 400, y: 200, outerRadius: 30, innerRadius: 15,
              points: 6, fill: "#f1c40f", stroke: "#e67e22", strokeWidth: 2
            },
            animations: [
              {
                property: "outerRadius",
                startValue: 30,
                endValue: 50,
                duration: 1500,
                easing: "easeInOutBounce",
                alternate: true,
                repeat: true
              },
              {
                property: "rotation",
                startValue: 0,
                endValue: 6.28,
                duration: 3000,
                easing: "linear",
                repeat: true
              }
            ]
          },
          // Orbiting particles
          {
            id: "particles",
            type: "particle",
            props: {
              particles: Array.from({length: 12}, (_, i) => ({
                x: 400 + Math.cos(i * 0.524) * 80,
                y: 200 + Math.sin(i * 0.524) * 80,
                size: 4,
                color: `hsl(${i * 30}, 70%, 60%)`,
                opacity: 0.8
              }))
            },
            animations: []
          }
        ]
      }
    };
  }

  /**
   * Check if validation engine is available
   */
  isValidationAvailable() {
    return this.validationEngine !== null;
  }

  /**
   * Get quick validation status for a response
   */
  async quickValidate(response) {
    if (!this.validationEngine) {
      return { isValid: false, issues: ['Validation engine not available'], needsCorrection: false };
    }
    
    return await this.validationEngine.quickValidate(response);
  }

  /**
   * Manually validate and fix a response
   */
  async validateResponse(response, originalQuestion) {
    if (!this.validationEngine) {
      throw new Error('Validation engine not available');
    }
    
    return await this.validationEngine.validateAndFix(response, originalQuestion);
  }
}

module.exports = LLMService;
