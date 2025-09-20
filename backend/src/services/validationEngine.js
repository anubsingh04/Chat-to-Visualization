require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

class ValidationEngine {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for validation engine');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent validation
        topK: 1,
        topP: 0.8,
      }
    });
  }

  /**
   * Validates and fixes LLM-generated visualization response
   * @param {Object} llmResponse - The original LLM response
   * @param {string} originalQuestion - The user's original question
   * @returns {Object} - Validated and potentially corrected response
   */
  async validateAndFix(llmResponse, originalQuestion) {
    try {
      console.log('🔍 Starting validation for LLM response...');
      
      // Parse the response if it's a string
      let parsedResponse;
      try {
        parsedResponse = typeof llmResponse === 'string' ? JSON.parse(llmResponse) : llmResponse;
      } catch (parseError) {
        console.error('❌ Failed to parse LLM response:', parseError);
        throw new Error('Invalid JSON response from LLM');
      }

      // Create validation prompt
      const validationPrompt = this.buildValidationPrompt(parsedResponse, originalQuestion);
      
      // Get validation from Gemini
      const result = await this.model.generateContent(validationPrompt);
      const response = await result.response;
      const validationText = response.text();
      
      console.log('🔍 Validation response received from Gemini');
      
      // Parse validation response
      const validatedResponse = this.parseValidationResponse(validationText);
      
      // Return the corrected response
      return validatedResponse;
      
    } catch (error) {
      console.error('❌ Validation engine error:', error);
      // Return original response if validation fails
      console.log('⚠️ Returning original response due to validation failure');
      return parsedResponse || llmResponse;
    }
  }

  /**
   * Builds the validation prompt for Gemini
   */
  buildValidationPrompt(response, originalQuestion) {
    return `You are an expert visualization validation engine. Your job is to analyze and fix visualization responses.

ORIGINAL USER QUESTION: "${originalQuestion}"

CURRENT LLM RESPONSE:
\`\`\`json
${JSON.stringify(response, null, 2)}
\`\`\`

VALIDATION REQUIREMENTS:

1. STRUCTURE VALIDATION:
   - Must have "text" and "visualization" properties
   - Visualization must have "id", "duration", "fps", "layers"
   - Each layer must have "id", "type", "props", "animations"

2. ANIMATION LOGIC VALIDATION:
   - Check if animations make educational sense
   - Ensure smooth transitions and realistic timing
   - Verify easing functions are appropriate
   - Check if animation durations create good flow
   - Ensure animations don't conflict with each other

3. VISUAL DESIGN VALIDATION:
   - Must have dark background for space/night scenes to avoid white-on-white
   - Check color contrast and visibility
   - Verify positioning doesn't cause overlap issues
   - Ensure text labels are positioned clearly

4. EDUCATIONAL VALUE:
   - Animations should illustrate the scientific concept
   - Check if visualization matches the question topic
   - Ensure adequate explanatory text and labels

5. TECHNICAL CORRECTNESS:
   - Validate all shape properties exist and are correct
   - Check coordinate ranges make sense
   - Verify animation properties use correct syntax
   - Ensure easing types are valid: linear, ease-in, ease-out, ease-in-out, ease-in-cubic, ease-out-cubic, elastic, bounce

SUPPORTED SHAPES & PROPERTIES:
• circle: { x, y, r, fill?, stroke?, strokeWidth?, opacity? }
• rectangle: { x, y, width, height, fill?, stroke?, strokeWidth?, opacity? }
• ellipse: { x, y, radiusX, radiusY, fill?, stroke?, strokeWidth?, opacity? }
• line: { x1, y1, x2, y2, stroke?, strokeWidth?, opacity? }
• arrow: { x, y, dx, dy, color?, opacity? }
• text: { x, y, text, fontSize?, color?, textAlign?, opacity? }
• star: { x, y, outerRadius, innerRadius?, points?, fill?, stroke?, strokeWidth?, rotation?, opacity? }
• spiral: { x, y, maxRadius, turns?, startAngle?, stroke?, strokeWidth?, opacity? }
• arc: { x, y, radius, startAngle, endAngle, counterclockwise?, sector?, fill?, stroke?, strokeWidth?, opacity? }
• bezier: { startPoint: {x, y}, endPoint: {x, y}, controlPoint1?: {x, y}, controlPoint2?: {x, y}, stroke?, strokeWidth?, opacity? }
• polygon: { points: [{x, y}, ...], fill?, stroke?, strokeWidth?, opacity? }
• wave: { startX, startY, endX, amplitude, frequency, phase?, stroke?, strokeWidth?, opacity? }
• gradient: { shape: "rectangle", type: "linear|radial", x, y, width?, height?, radius?, colorStops: [{offset: 0-1, color: "#hex"}], opacity? }
• particle: { particles: [{x, y, size, color?, opacity?}, ...], opacity? }

ANIMATION FORMAT:
{
  "property": "property_name",
  "startValue": start,
  "endValue": end,
  "duration": milliseconds,
  "delay": start_delay?,
  "easing": "linear|ease-in|ease-out|ease-in-out|ease-in-cubic|ease-out-cubic|elastic|bounce",
  "repeat": true/false?,
  "alternate": true/false?
}

Special Animations:
- "orbit" property: Makes objects revolve in circles
  Example: { property: "orbit", centerX: 400, centerY: 200, radius: 100, duration: 3000, repeat: true }


INSTRUCTIONS:
1. If the response is VALID and well-designed, return it unchanged
2. If there are ISSUES, fix them while preserving the core concept
3. Add missing elements (background, labels, better animations)
4. Improve educational value and visual appeal
5. Ensure all technical requirements are met

RESPONSE FORMAT:
Return ONLY a valid JSON object with the corrected visualization. Do not include any markdown formatting or explanation text.

Example of what to return:
{
  "text": "Corrected explanation text",
  "visualization": {
    "id": "corrected_viz",
    "duration": 6000,
    "fps": 30,
    "layers": [...]
  }
}`;
  }

  /**
   * Parses and validates the response from Gemini
   */
  parseValidationResponse(validationText) {
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = validationText
        .replace(/```json\n?|\n?```/g, '')
        .trim();
      
      const parsedResponse = JSON.parse(cleanedResponse);
      
      // Validate the structure
      if (!parsedResponse.text || !parsedResponse.visualization) {
        throw new Error('Invalid response structure');
      }
      
      if (!parsedResponse.visualization.layers || !Array.isArray(parsedResponse.visualization.layers)) {
        throw new Error('Invalid visualization layers');
      }
      
      console.log('✅ Validation successful - response corrected');
      return parsedResponse;
      
    } catch (error) {
      console.error('❌ Failed to parse validation response:', error);
      throw error;
    }
  }

  /**
   * Quick validation check without full correction
   * @param {Object} response - Response to validate
   * @returns {Object} - Validation result with issues found
   */
  async quickValidate(response) {
    const issues = [];
    
    try {
      // Structure checks
      if (!response.text) issues.push('Missing text explanation');
      if (!response.visualization) issues.push('Missing visualization object');
      if (!response.visualization?.layers) issues.push('Missing visualization layers');
      
      // Layer validation
      if (response.visualization?.layers) {
        response.visualization.layers.forEach((layer, index) => {
          if (!layer.id) issues.push(`Layer ${index + 1}: Missing id`);
          if (!layer.type) issues.push(`Layer ${index + 1}: Missing type`);
          if (!layer.props) issues.push(`Layer ${index + 1}: Missing props`);
          
          // Check for white colors on white background
          if (layer.props?.fill === '#ffffff' || layer.props?.color === '#ffffff') {
            issues.push(`Layer ${index + 1}: Using white color on white background (invisible)`);
          }
          
          // Animation validation
          if (layer.animations) {
            layer.animations.forEach((anim, animIndex) => {
              if (!anim.property) issues.push(`Layer ${index + 1}, Animation ${animIndex + 1}: Missing property`);
              if (anim.duration === undefined) issues.push(`Layer ${index + 1}, Animation ${animIndex + 1}: Missing duration`);
            });
          }
        });
      }
      
      return {
        isValid: issues.length === 0,
        issues: issues,
        needsCorrection: issues.length > 0
      };
      
    } catch (error) {
      return {
        isValid: false,
        issues: [`Validation error: ${error.message}`],
        needsCorrection: true
      };
    }
  }
}

module.exports = ValidationEngine;