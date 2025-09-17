import { Shape, ShapeRegistry } from '../Shape.js';

/**
 * Circle Shape - Renders filled circles
 * 
 * Properties:
 * - center: { x, y } coordinates (or x, y separately)
 * - radius: Circle radius (or r)
 * - fill: Fill color (default: '#3498db')
 * - opacity: Transparency 0-1 (default: 1)
 */
export class Circle extends Shape {
  static type = 'circle';
  
  constructor(id, props = {}) {
    // Normalize properties to expected format
    const normalizedProps = {
      center: props.center || { x: props.x || 100, y: props.y || 100 },
      radius: props.radius || props.r || 20,
      fill: props.fill || props.color || '#3498db',
      opacity: props.opacity || 1,
      ...props
    };
    
    super(id, normalizedProps);
  }
  
  /**
   * Render circle to canvas
   */
  render(ctx) {
    const props = this.getCurrentProperties();
    console.log(`🔴 [Circle] Rendering circle with props:`, props);
    
    // Get center coordinates
    const center = props.center || { x: props.x || 0, y: props.y || 0 };
    const radius = props.radius || props.r || 20;
    
    console.log(`🔴 [Circle] Drawing at center: [${center.x}, ${center.y}], radius: ${radius}`);
    
    // Save canvas state
    ctx.save();
    
    // Set circle appearance
    ctx.fillStyle = props.fill || '#3498db';
    ctx.globalAlpha = props.opacity || 1;
    
    console.log(`🔴 [Circle] Fill style: ${ctx.fillStyle}, Alpha: ${ctx.globalAlpha}`);
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    console.log(`🔴 [Circle] ✅ Circle draw commands executed`);
    
    // Add stroke if specified
    if (props.stroke && props.strokeWidth) {
      ctx.strokeStyle = props.stroke;
      ctx.lineWidth = props.strokeWidth;
      ctx.stroke();
      console.log(`🔴 [Circle] ✅ Stroke added: ${props.stroke}, width: ${props.strokeWidth}`);
    }
    
    // Restore canvas state
    ctx.restore();
    
    console.log(`🔴 [Circle] ✅ Circle rendering completed`);
  }
  
  /**
   * Calculate bounding box for circle
   */
  calculateBounds(props) {
    const center = props.center || { x: props.x || 0, y: props.y || 0 };
    const radius = props.radius || props.r || 20;
    
    return {
      x: center.x - radius,
      y: center.y - radius,
      width: radius * 2,
      height: radius * 2
    };
  }
}

/**
 * Arrow Shape - Renders directional arrows
 * 
 * Properties:
 * - x, y: Start coordinates
 * - dx, dy: Direction vector
 * - color: Arrow color (default: '#e74c3c')
 * - lineWidth: Arrow thickness (default: 3)
 * - headLength: Arrowhead size (default: 15)
 * - opacity: Transparency 0-1 (default: 1)
 */
export class Arrow extends Shape {
  static type = 'arrow';
  
  constructor(id, props = {}) {
    // Normalize properties
    const normalizedProps = {
      start: props.start || { x: props.x || 100, y: props.y || 100 },
      direction: props.direction || { x: props.dx || 1, y: props.dy || 0 },
      length: props.length || 100,
      color: props.color || '#e74c3c',
      thickness: props.thickness || props.lineWidth || 3,
      opacity: props.opacity || 1,
      ...props
    };
    
    super(id, normalizedProps);
  }
  
  /**
   * Render arrow to canvas
   */
  render(ctx) {
    const props = this.getCurrentProperties();
    
    // Get start position and direction
    const start = props.start || { x: 100, y: 100 };
    const direction = props.direction || { x: 1, y: 0 };
    const length = props.length || 100;
    
    // Normalize direction vector
    const dirMagnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    const normalizedDir = {
      x: dirMagnitude > 0 ? direction.x / dirMagnitude : 1,
      y: dirMagnitude > 0 ? direction.y / dirMagnitude : 0
    };
    
    // Calculate end point
    const end = {
      x: start.x + normalizedDir.x * length,
      y: start.y + normalizedDir.y * length
    };
    
    // Save canvas state
    ctx.save();
    
    // Set arrow appearance
    ctx.strokeStyle = props.color || '#e74c3c';
    ctx.fillStyle = props.color || '#e74c3c';
    ctx.lineWidth = props.thickness || 3;
    ctx.globalAlpha = props.opacity || 1;
    
    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Calculate arrowhead
    const angle = Math.atan2(normalizedDir.y, normalizedDir.x);
    const headLength = Math.min(length * 0.2, 15); // Proportional head size
    
    // Draw arrowhead triangle
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    // Restore canvas state
    ctx.restore();
  }
  
  /**
   * Calculate bounding box for arrow
   */
  calculateBounds(props) {
    const start = props.start || { x: 100, y: 100 };
    const direction = props.direction || { x: 1, y: 0 };
    const length = props.length || 100;
    
    // Calculate end point
    const dirMagnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    const normalizedDir = {
      x: dirMagnitude > 0 ? direction.x / dirMagnitude : 1,
      y: dirMagnitude > 0 ? direction.y / dirMagnitude : 0
    };
    
    const end = {
      x: start.x + normalizedDir.x * length,
      y: start.y + normalizedDir.y * length
    };
    
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    
    return {
      x: minX - 10, // Add padding for arrowhead
      y: minY - 10,
      width: (maxX - minX) + 20,
      height: (maxY - minY) + 20
    };
  }
}

/**
 * Text Shape - Renders text labels
 * 
 * Properties:
 * - x, y: Position coordinates
 * - text: Text content
 * - fontSize: Font size (default: 16)
 * - fontFamily: Font family (default: 'Arial')
 * - color: Text color (default: '#2c3e50')
 * - textAlign: Horizontal alignment (default: 'left')
 * - textBaseline: Vertical alignment (default: 'top')
 * - opacity: Transparency 0-1 (default: 1)
 */
export class Text extends Shape {
  static type = 'text';
  
  constructor(id, props = {}) {
    // Normalize properties
    const normalizedProps = {
      position: props.position || { x: props.x || 50, y: props.y || 50 },
      text: props.text || props.content || '',
      font: props.font || `${props.fontSize || 16}px ${props.fontFamily || 'Arial'}`,
      fill: props.fill || props.color || '#2c3e50',
      align: props.align || props.textAlign || 'left',
      baseline: props.baseline || props.textBaseline || 'top',
      opacity: props.opacity || 1,
      ...props
    };
    
    super(id, normalizedProps);
  }
  
  /**
   * Render text to canvas
   */
  render(ctx) {
    const props = this.getCurrentProperties();
    console.log(`📝 [Text] Rendering text with props:`, props);
    
    // Get position and text properties
    const position = props.position || { x: 50, y: 50 };
    const text = props.text || '';
    const font = `${props.fontSize || 16}px ${props.fontFamily || 'Arial'}`;
    const fill = props.fill || '#2c3e50';
    const align = props.align || 'left';
    const baseline = props.baseline || 'top';
    
    console.log(`📝 [Text] Drawing "${text}" at position: [${position.x}, ${position.y}]`);
    console.log(`📝 [Text] Font: ${font}, Fill: ${fill}`);
    
    // Save canvas state
    ctx.save();
    
    // Set text appearance
    ctx.fillStyle = fill;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.globalAlpha = props.opacity || 1;
    
    console.log(`📝 [Text] Canvas style set - fillStyle: ${ctx.fillStyle}, font: ${ctx.font}, alpha: ${ctx.globalAlpha}`);
    
    // Draw text
    ctx.fillText(text, position.x, position.y);
    
    console.log(`📝 [Text] ✅ Text draw command executed`);
    
    // Restore canvas state
    ctx.restore();
    
    console.log(`📝 [Text] ✅ Text rendering completed`);
  }
  
  /**
   * Calculate bounding box for text
   * Note: This is approximate since we can't easily measure text without canvas
   */
  calculateBounds(props) {
    const position = props.position || { x: 50, y: 50 };
    const text = props.text || '';
    const font = props.font || '16px Arial';
    
    // Extract font size from font string (rough estimate)
    const fontSizeMatch = font.match(/(\d+)px/);
    const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 16;
    
    const approxCharWidth = fontSize * 0.6; // Rough estimate
    const width = text.length * approxCharWidth;
    const height = fontSize * 1.2; // Include line height
    
    return {
      x: position.x,
      y: position.y,
      width: width,
      height: height
    };
  }
}

/**
 * Line Shape - Renders straight lines
 * 
 * Properties:
 * - x1, y1: Start coordinates
 * - x2, y2: End coordinates
 * - stroke: Line color (default: '#34495e')
 * - strokeWidth: Line thickness (default: 2)
 * - opacity: Transparency 0-1 (default: 1)
 */
export class Line extends Shape {
  static type = 'line';
  
  constructor(id, props = {}) {
    // Normalize properties
    const normalizedProps = {
      start: props.start || { x: props.x1 || 0, y: props.y1 || 0 },
      end: props.end || { x: props.x2 || 50, y: props.y2 || 0 },
      stroke: props.stroke || '#34495e',
      lineWidth: props.lineWidth || props.strokeWidth || 2,
      opacity: props.opacity || 1,
      ...props
    };
    
    super(id, normalizedProps);
  }
  
  /**
   * Render line to canvas
   */
  render(ctx) {
    const props = this.getCurrentProperties();
    
    // Get start and end points
    const start = props.start || { x: 0, y: 0 };
    const end = props.end || { x: 50, y: 0 };
    
    // Save canvas state
    ctx.save();
    
    // Set line appearance
    ctx.strokeStyle = props.stroke || '#34495e';
    ctx.lineWidth = props.lineWidth || 2;
    ctx.globalAlpha = props.opacity || 1;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Restore canvas state
    ctx.restore();
  }
  
  /**
   * Calculate bounding box for line
   */
  calculateBounds(props) {
    const start = props.start || { x: 0, y: 0 };
    const end = props.end || { x: 50, y: 0 };
    
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y)
    };
  }
}

// Register all shape types with the registry
ShapeRegistry.register('circle', Circle);
ShapeRegistry.register('arrow', Arrow);
ShapeRegistry.register('text', Text);
ShapeRegistry.register('line', Line);

console.log('✅ Registered shape types:', ShapeRegistry.getAvailableTypes());