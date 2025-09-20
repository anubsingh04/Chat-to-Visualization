export class VisualizationEngine {
  constructor(canvas, context) {
    // Validate required dependencies - canvas element and 2D rendering context
    if (!canvas || !context) {
      throw new Error('Canvas and context are required');
    }
    
    /*
    NORMALIZATION SYSTEM:
    The engine now automatically handles LLM data with any coordinate range.
    Examples:
    - LLM provides coordinates in range [0, 1000] → Auto-normalized to canvas size
    - LLM provides coordinates in range [-50, 50] → Auto-normalized to canvas size
    - LLM provides coordinates in range [100, 200] → Auto-normalized to canvas size
    
    Features:
    - Auto-detects coordinate bounds from visualization data
    - Maintains aspect ratio while fitting to canvas
    - Configurable padding from edges
    - Can be disabled for manual coordinate control
    
    Usage:
    engine.setNormalization(true, 20);  // Enable with 20px padding
    engine.setNormalization(false);     // Disable (use original coordinates)
    */
    
    // Store references to HTML canvas element and its 2D rendering context
    this.canvas = canvas;
    this.ctx = context;
    
    // Animation state management
    this.isPlaying = false;        // Track whether animation is currently running
    this.isPaused = false;         // Track if animation is paused (vs stopped)
    this.startTime = null;         // Timestamp when animation started (for timing calculations)
    this.pauseTime = 0;            // Time when animation was paused
    this.totalPauseTime = 0;       // Total time spent paused
    this.currentTime = 0;          // Current position in animation timeline (milliseconds)
    this.visualization = null;     // The loaded visualization data (JSON with layers/animations)
    this.animationFrame = null;    // requestAnimationFrame ID for cancellation
    this.loop = true;              // Whether to loop the animation
    
    // Debug and diagnostics
    this.debug = true;             // Enable/disable console logging for development
    this.lastFrameStats = { layersTried: 0, layersDrawn: 0, errors: [] }; // Track rendering performance
    
    // Responsive scaling system - converts logical coordinates to actual canvas size
    this.baseWidth = 800;          // Design-time logical width (coordinates in visualization data)
    this.baseHeight = 600;         // Design-time logical height 
    this.scaleX = 1;              // Current horizontal scaling factor (actual/logical)
    this.scaleY = 1;              // Current vertical scaling factor
    
    // Normalization system - handles LLM data that might have any coordinate range
    this.normalizationBounds = null;  // Calculated bounds from LLM data
    this.normalizationEnabled = true; // Whether to auto-normalize coordinates
    this.padding = 20;                // Padding from canvas edges (pixels)
    
    // Apply high-DPI scaling for crisp rendering on retina displays
    this._applyHiDPIScaling();
  }

  loadVisualization(vizData) {
    // Validate input - ensure we have visualization data to load
    if (!vizData) {
      console.warn('No visualization data provided');
      return;
    }
    
    // Log the visualization data being loaded (when debug mode enabled)
    if (this.debug) console.log('Loading visualization:', vizData);
    
    // Store the visualization data (contains layers, duration, animations)
    this.visualization = vizData;
    
    // Calculate normalization bounds for auto-scaling
    this.normalizationBounds = this._calculateVisualizationBounds(vizData);
    
    if (this.debug && this.normalizationBounds) {
      console.log('Normalization enabled with bounds:', this.normalizationBounds);
    } else if (this.debug) {
      console.log('Normalization disabled - using original coordinates');
    }
    
    // Reset animation state to beginning
    this.reset();
  }

  reset() {
    // Log reset operation for debugging
    if (this.debug) console.log('Resetting visualization');
    
    // Reset timeline to beginning
    this.currentTime = 0;           // Back to start of animation
    this.startTime = null;          // Clear start timestamp
    this.isPlaying = false;         // Stop any current playback
    
    // Cancel any running animation loop to prevent conflicts
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Render the first frame (t=0 state)
    this.render();
  }

  play() {
    // Don't start if no visualization is loaded
    if (!this.visualization) return;
    
    // Set playing state
    this.isPlaying = true;
    
    // Calculate start timestamp: current time minus elapsed time
    // This allows resuming from current position rather than restarting
    this.startTime = performance.now() - this.currentTime;
    
    // Begin the animation loop
    this.animate();
  }

  pause() {
    // Stop the animation
    this.isPlaying = false;
    
    // Cancel the animation frame to stop the loop
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    // Note: currentTime is preserved, so play() can resume from here
  }

  // Stop the animation and reset to the beginning
  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
    
    // Cancel the animation frame to stop the loop
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Render the initial frame
    if (this.visualization) {
      this.render();
    }
  }

  // Toggle between play and pause
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // Set looping behavior
  setLoop(enabled) {
    this.loop = enabled;
    console.log('Loop', enabled ? 'enabled' : 'disabled');
  }

  animate() {
    // Exit if animation was paused/stopped
    if (!this.isPlaying) return;

    // Get current timestamp and calculate elapsed animation time
    const now = performance.now();
    this.currentTime = now - this.startTime;

    // Check if animation has reached the end
    if (this.currentTime >= this.visualization.duration) {
      if (this.loop) {
        // Restart the animation for looping
        this.currentTime = 0;
        this.startTime = performance.now();
        console.log('Animation loop restarting');
      } else {
        // Stop at the end if not looping
        this.currentTime = this.visualization.duration;  // Clamp to exact end
        this.isPlaying = false;                         // Stop playback
        console.log('Animation completed, not looping');
      }
    }

    // Render current frame with updated timeline position
    this.render();

    // Continue animation loop if still playing
    if (this.isPlaying) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }

  render() {
    // Safety check - ensure all required components are available
    if (!this.visualization || !this.canvas || !this.ctx) {
      console.warn('Cannot render: missing visualization, canvas, or context');
      return;
    }

    // Debug logging to track render calls and timeline position
    if (this.debug) console.log('Rendering visualization at time:', this.currentTime);

    // Clear the entire canvas to prepare for new frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate responsive scaling factors based on current canvas size vs. logical size
    // Use CSS dimensions if available, fallback to logical dimensions
    const displayWidth = parseInt(this.canvas.style.width) || this.baseWidth;
    const displayHeight = parseInt(this.canvas.style.height) || this.baseHeight;
    this.scaleX = displayWidth / this.baseWidth;    // Horizontal scale factor
    this.scaleY = displayHeight / this.baseHeight;  // Vertical scale factor
    if (this.debug) console.log('Scale factors', this.scaleX, this.scaleY);

    // Reset frame statistics for performance tracking
    this.lastFrameStats = { layersTried: 0, layersDrawn: 0, errors: [] };
    
    // Render each layer in order (layers are like Photoshop layers - painted top to bottom)
    (this.visualization.layers || []).forEach((layer, index) => {
      if (this.debug) console.log(`Rendering layer ${index}:`, layer.type, layer.id);
      
      try {
        this.lastFrameStats.layersTried++;     // Count attempt
        this.renderLayer(layer);               // Actually draw the layer
        this.lastFrameStats.layersDrawn++;     // Count success
      } catch (e) {
        // Handle individual layer errors without breaking entire frame
        console.warn('Layer render error', layer.id, e);
        this.lastFrameStats.errors.push({ id: layer.id, error: e.message });
      }
    });

    // Debug output showing render performance stats
    if (this.debug) console.log('🧾 Frame stats:', this.lastFrameStats);
  }

  renderLayer(layer) {
    // Calculate current properties for this layer at current timeline position
    // This handles both static props and animated values
    const props = this.calculateProperties(layer);
    
    // Debug logging to show what properties we're using to draw
    if (this.debug) console.log(`Rendering ${layer.type} with props:`, props);

    // Dispatch to appropriate shape renderer based on layer type
    switch (layer.type) {
      case 'circle':
        this.renderCircle(props);       // Draw filled circle
        break;
      case 'arrow':
        this.renderArrow(props);        // Draw directional arrow
        break;
      case 'text':
        this.renderText(props);         // Draw text label
        break;
      case 'line':
        this.renderLine(props);         // Draw straight line
        break;
      case 'rectangle':
      case 'rect':
        this.renderRectangle(props);    // Draw rectangle
        break;
      case 'ellipse':
        this.renderEllipse(props);      // Draw ellipse
        break;
      case 'polygon':
        this.renderPolygon(props);      // Draw polygon
        break;
      case 'path':
        this.renderPath(props);         // Draw custom path/curve
        break;
      case 'gradient':
        this.renderGradient(props);     // Draw gradient shape
        break;
      case 'particle':
        this.renderParticle(props);     // Draw particle effect
        break;
      case 'wave':
        this.renderWave(props);         // Draw sine wave
        break;
      case 'spiral':
        this.renderSpiral(props);       // Draw spiral
        break;
      case 'star':
        this.renderStar(props);         // Draw star shape
        break;
      case 'arc':
        this.renderArc(props);          // Draw arc/sector
        break;
      case 'bezier':
        this.renderBezier(props);       // Draw bezier curve
        break;
      default:
        console.warn('Unknown layer type:', layer.type);
    }
  }

  calculateProperties(layer) {
    // Start with base properties from layer definition (static values)
    const props = { ...(layer.props || {}) };
    
    // Get animations array (if any) - safely handle missing animations
    const animations = Array.isArray(layer.animations) ? layer.animations : [];

    // PROPERTY NORMALIZATION - Handle different naming conventions from LLM
    // Different AI models might use different property names for the same thing
    if (props.radius && !props.r) props.r = props.radius;                    // radius -> r
    if (props.size && !props.r) props.r = props.size;                        // size -> r  
    if (props.color && !props.fill && layer.type === 'circle') props.fill = props.color;  // color -> fill for circles
    if (props.fillColor && !props.fill) props.fill = props.fillColor;        // fillColor -> fill
    if (props.strokeColor && !props.stroke) props.stroke = props.strokeColor; // strokeColor -> stroke
    if (layer.type === 'text' && props.content && !props.text) props.text = props.content; // content -> text
    if (props.color && !props.fill && ['rectangle', 'rect', 'ellipse', 'polygon'].includes(layer.type)) {
      props.fill = props.color; // color -> fill for shapes
    }

    // DEFAULT VALUES - Ensure shapes have minimum required properties
    if (layer.type === 'circle') {
      if (typeof props.r !== 'number') props.r = 20;        // Default radius
      if (typeof props.x !== 'number') props.x = 100;       // Default X position
      if (typeof props.y !== 'number') props.y = 100;       // Default Y position
    }
    if (layer.type === 'text') {
      if (!props.text) props.text = '';                     // Default empty text
      if (typeof props.x !== 'number') props.x = 50;        // Default X position
      if (typeof props.y !== 'number') props.y = 50;        // Default Y position
    }
    if (layer.type === 'line') {
      if (typeof props.x1 !== 'number') props.x1 = 0;       // Default start X
      if (typeof props.y1 !== 'number') props.y1 = 0;       // Default start Y
      if (typeof props.x2 !== 'number') props.x2 = props.x1 + 50;  // Default end X
      if (typeof props.y2 !== 'number') props.y2 = props.y1;       // Default end Y
    }
    if (['rectangle', 'rect'].includes(layer.type)) {
      if (typeof props.x !== 'number') props.x = 50;        // Default X position
      if (typeof props.y !== 'number') props.y = 50;        // Default Y position
      if (typeof props.width !== 'number') props.width = 100;  // Default width
      if (typeof props.height !== 'number') props.height = 60; // Default height
    }
    if (layer.type === 'ellipse') {
      if (typeof props.x !== 'number') props.x = 100;       // Default center X
      if (typeof props.y !== 'number') props.y = 100;       // Default center Y
      if (typeof props.radiusX !== 'number') props.radiusX = props.width ? props.width/2 : 50;
      if (typeof props.radiusY !== 'number') props.radiusY = props.height ? props.height/2 : 30;
    }
    if (layer.type === 'polygon') {
      if (!Array.isArray(props.points) || props.points.length < 3) {
        // Default triangle
        props.points = [
          { x: 100, y: 50 },
          { x: 150, y: 150 },
          { x: 50, y: 150 }
        ];
      }
    }

    // ANIMATION PROCESSING - Apply time-based changes to properties
    animations.forEach(animation => {
      // Skip invalid animations
      if (!animation || !animation.property) return;

      // SPECIAL CASE: Scale animation (for growing/shrinking effects)
      if (animation.property === 'scale') {
        const start = animation.start ?? 0;
        const duration = animation.duration ?? (this.visualization?.duration || 1000);
        
        if (duration > 0 && this.currentTime >= start) {
          const localT = Math.min((this.currentTime - start) / duration, 1);
          const eased = this.easeInOutQuad(localT);
          const scale = (animation.from ?? 1) + ((animation.to ?? 1) - (animation.from ?? 1)) * eased;
          
          // Apply scale to size-related properties
          if (props.r) props.r *= scale;
          if (props.width) props.width *= scale;
          if (props.height) props.height *= scale;
          if (props.radiusX) props.radiusX *= scale;
          if (props.radiusY) props.radiusY *= scale;
          if (props.fontSize) props.fontSize *= scale;
        }
        return;
      }

      // SPECIAL CASE: Color transition animation
      if (animation.property === 'colorTransition') {
        const start = animation.start ?? 0;
        const duration = animation.duration ?? (this.visualization?.duration || 1000);
        
        if (duration > 0 && this.currentTime >= start && this.currentTime <= start + duration) {
          const localT = (this.currentTime - start) / duration;
          const eased = this.easeInOutQuad(localT);
          
          // Interpolate between from and to colors
          const fromColor = this._parseColor(animation.from || '#000000');
          const toColor = this._parseColor(animation.to || '#FFFFFF');
          
          const r = Math.round(fromColor.r + (toColor.r - fromColor.r) * eased);
          const g = Math.round(fromColor.g + (toColor.g - fromColor.g) * eased);
          const b = Math.round(fromColor.b + (toColor.b - fromColor.b) * eased);
          
          const interpolatedColor = `rgb(${r}, ${g}, ${b})`;
          props.fill = interpolatedColor;
          props.color = interpolatedColor;
        }
        return;
      }

      // SPECIAL CASE: Orbital motion (circular movement around a center point)
      if (animation.property === 'orbit') {
        // Support both old and new animation format
        const start = animation.start ?? animation.delay ?? 0;
        const duration = animation.duration ?? 1000;
        
        // Skip if duration is invalid
        if (duration <= 0) return;
        
        // Only apply if current time is past start time
        if (this.currentTime >= start) {
          // Calculate local time within this animation
          let localT = this.currentTime - start;
          
          // Handle repeating orbital motion
          if (animation.repeat) {
            localT = localT % duration;
          } else {
            // Clamp to duration if not repeating
            localT = Math.min(localT, duration);
          }
          
          const progress = localT / duration;           // 0-1 progress through one orbit
          const startAngle = animation.startAngle ?? 0; // Starting angle offset
          const angle = startAngle + progress * Math.PI * 2; // Convert to radians (0-2π)
          
          // Get orbit parameters with fallbacks
          const cx = animation.centerX ?? props.x ?? 0; // Center X
          const cy = animation.centerY ?? props.y ?? 0; // Center Y  
          const radius = animation.radius ?? 0;         // Orbit radius
          
          // Calculate new position on orbit circle
          props.x = cx + radius * Math.cos(angle);      // X = center + radius * cos(angle)
          props.y = cy + radius * Math.sin(angle);      // Y = center + radius * sin(angle)
        }
        return; // Exit early - orbit overrides other animations
      }

      // STANDARD ANIMATIONS - Property interpolation between start and end values
      // Support both old format (start/end/from/to) and new format (startValue/endValue/duration/repeat)
      const start = animation.start ?? animation.delay ?? 0;
      const duration = animation.duration ?? (animation.end ? (animation.end - start) : 1000);
      const from = animation.from ?? animation.startValue;
      const to = animation.to ?? animation.endValue;
      
      // Skip invalid animations
      if (duration <= 0) return;                        // Invalid duration
      if (from === undefined || to === undefined) return; // Missing values
      
      // Handle repeating animations
      let currentTime = this.currentTime - start;
      if (currentTime < 0) return; // Animation hasn't started yet
      
      if (animation.repeat) {
        // For repeating animations, use modulo to loop
        if (animation.alternate) {
          // Back and forth (ping-pong) animation
          const cycleTime = duration * 2;
          const timeInCycle = currentTime % cycleTime;
          if (timeInCycle <= duration) {
            currentTime = timeInCycle;
          } else {
            currentTime = duration - (timeInCycle - duration);
          }
        } else {
          // Simple repeat (restart from beginning)
          currentTime = currentTime % duration;
        }
      } else {
        // Non-repeating animation - clamp to duration
        currentTime = Math.min(currentTime, duration);
      }
      
      // Calculate progress through animation (0-1)
      const rawProgress = currentTime / duration;
      
      // Apply easing function for smooth motion
      const easing = animation.easing || 'easeInOutQuad';
      const easingFunc = this._getEasingFunction(easing);
      const eased = easingFunc(Math.min(Math.max(rawProgress, 0), 1));
      
      // Interpolate between start and end values
      const value = from + (to - from) * eased;
      
      // Apply calculated value to the property
      props[animation.property] = value;
    });

    // Return final properties with all static, default, and animated values combined
    return props;
  }

  renderCircle(props) {
    // Save current canvas state (styles, transforms, etc.)
    this.ctx.save();
    
    // NORMALIZATION: Convert LLM coordinates to canvas coordinates, then apply responsive scaling
    const normalizedX = this._normalizeCoordinate(props.x, true);   // Normalize X coordinate
    const normalizedY = this._normalizeCoordinate(props.y, false);  // Normalize Y coordinate
    const normalizedR = this._normalizeSize(props.r);               // Normalize radius
    
    // RESPONSIVE SCALING: Convert normalized coordinates to actual canvas coordinates
    const x = this._clamp(normalizedX * this.scaleX, 0, this.baseWidth * this.scaleX);   // Scale and clamp X
    const y = this._clamp(normalizedY * this.scaleY, 0, this.baseHeight * this.scaleY); // Scale and clamp Y
    const r = Math.max(0, normalizedR * ((this.scaleX + this.scaleY) / 2));             // Scale radius (average of X/Y scales)
    
    // Set circle appearance properties
    this.ctx.fillStyle = props.fill || '#3498db';                    // Fill color (default blue)
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1; // Transparency (default opaque)
    
    // Debug output showing actual rendered coordinates
    if (this.debug) console.log(`🔵 Rendering circle at (${x}, ${y}) scaled from (${props.x}, ${props.y}) r ${r}`);
    
    // Draw the circle using Canvas arc method
    this.ctx.beginPath();                    // Start new path
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);  // Create circular arc (full circle)
    this.ctx.fill();                        // Fill the circle
    
    // Restore previous canvas state
    this.ctx.restore();
  }

  renderArrow(props) {
    // Save canvas state
    this.ctx.save();
    
    // Set arrow styling properties  
    this.ctx.strokeStyle = props.color || '#e74c3c';        // Line color (default red)
    this.ctx.fillStyle = props.color || '#e74c3c';          // Arrowhead fill color
    this.ctx.lineWidth = 3;                                 // Line thickness
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1; // Transparency
    
    // NORMALIZATION: Convert LLM coordinates to canvas coordinates, then apply responsive scaling
    const normalizedX = this._normalizeCoordinate(props.x, true);   // Normalize start X
    const normalizedY = this._normalizeCoordinate(props.y, false);  // Normalize start Y
    
    // For arrows, we need to normalize the end point, not just the direction vector
    const endX = props.x + props.dx;
    const endY = props.y + props.dy;
    const normalizedEndX = this._normalizeCoordinate(endX, true);
    const normalizedEndY = this._normalizeCoordinate(endY, false);
    
    // Calculate normalized direction vector
    const normalizedDx = normalizedEndX - normalizedX;
    const normalizedDy = normalizedEndY - normalizedY;
    
    // Apply responsive scaling to position and direction vector
    const x = this._clamp(normalizedX * this.scaleX, 0, this.baseWidth * this.scaleX);   // Start X (normalized & scaled)
    const y = this._clamp(normalizedY * this.scaleY, 0, this.baseHeight * this.scaleY); // Start Y (normalized & scaled)
    const dx = normalizedDx * this.scaleX;                          // Direction vector X (normalized & scaled)
    const dy = normalizedDy * this.scaleY;                          // Direction vector Y (normalized & scaled)
    
    // Draw the main arrow line from start point to end point
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);                                  // Move to start position
    this.ctx.lineTo(x + dx, y + dy);                        // Draw line to end position
    this.ctx.stroke();                                      // Actually draw the line

    // Calculate arrowhead geometry
    const angle = Math.atan2(dy, dx);                       // Angle of arrow direction
    const headLength = 15;                                  // Length of arrowhead sides

    // Draw triangular arrowhead at end of line
    this.ctx.beginPath();
    this.ctx.moveTo(x + dx, y + dy);                        // Start at arrow tip
    // First side of arrowhead (angled back from tip)
    this.ctx.lineTo(
      x + dx - headLength * Math.cos(angle - Math.PI / 6), // X coordinate of first point
      y + dy - headLength * Math.sin(angle - Math.PI / 6)  // Y coordinate of first point
    );
    // Second side of arrowhead (angled back from tip in other direction)
    this.ctx.lineTo(
      x + dx - headLength * Math.cos(angle + Math.PI / 6), // X coordinate of second point  
      y + dy - headLength * Math.sin(angle + Math.PI / 6)  // Y coordinate of second point
    );
    this.ctx.closePath();                                   // Connect back to tip
    this.ctx.fill();                                        // Fill the arrowhead triangle

    // Restore canvas state
    this.ctx.restore();
  }

  renderText(props) {
    // Save canvas state
    this.ctx.save();
    
    // Set text styling properties
    this.ctx.fillStyle = props.color || '#2c3e50';          // Text color (default dark gray)
    
    // Calculate responsive font size (scale with average of X/Y scaling factors)
    const fontSize = (props.fontSize || 16) * ((this.scaleX + this.scaleY) / 2);
    this.ctx.font = `${fontSize}px Arial`;                  // Set font family and size
    
    this.ctx.textAlign = props.textAlign || 'left';         // Text alignment (left/center/right)
    this.ctx.textBaseline = 'top';                          // Vertical alignment from top
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1; // Transparency

    // NORMALIZATION: Convert LLM coordinates to canvas coordinates, then apply responsive scaling
    const normalizedX = this._normalizeCoordinate(props.x, true);   // Normalize X coordinate
    const normalizedY = this._normalizeCoordinate(props.y, false);  // Normalize Y coordinate
    
    // Apply responsive scaling and clamping to text position
    const x = this._clamp(normalizedX * this.scaleX, 0, this.baseWidth * this.scaleX);
    const y = this._clamp(normalizedY * this.scaleY, 0, this.baseHeight * this.scaleY);
    
    // Debug output showing text rendering details
    if (this.debug) console.log(`📝 Rendering text "${props.text}" at scaled (${x}, ${y}) from normalized (${normalizedX}, ${normalizedY}) from original (${props.x}, ${props.y})`);
    
    // Actually draw the text at calculated position
    this.ctx.fillText(props.text, x, y);
    
    // Restore canvas state
    this.ctx.restore();
  }

  renderText(props) {
    // Save canvas state
    this.ctx.save();
    
    // Set text styling properties
    const fontSize = props.fontSize || props.size || 16;
    const fontFamily = props.fontFamily || props.font || 'Arial';
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = props.fill || props.color || '#2c3e50';
    this.ctx.textAlign = props.align || 'left';
    this.ctx.textBaseline = props.baseline || 'top';
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Apply responsive scaling to position
    const x = this._clamp(props.x * this.scaleX, 0, this.baseWidth * this.scaleX);
    const y = this._clamp(props.y * this.scaleY, 0, this.baseHeight * this.scaleY);
    
    // Get the text content
    const text = props.text || props.content || '';
    
    // Debug output
    if (this.debug) console.log(`📝 Rendering text "${text}" at scaled (${x}, ${y})`);
    
    // Add stroke/outline if specified
    if (props.stroke && props.strokeWidth) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth;
      this.ctx.strokeText(text, x, y);
    }
    
    // Draw the text
    this.ctx.fillText(text, x, y);
    
    // Restore canvas state
    this.ctx.restore();
  }

  renderRectangle(props) {
    // Save canvas state
    this.ctx.save();
    
    // Set styling properties
    this.ctx.fillStyle = props.fill || props.color || '#3498db';
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Apply responsive scaling to position and size
    const x = this._clamp(props.x * this.scaleX, 0, this.baseWidth * this.scaleX);
    const y = this._clamp(props.y * this.scaleY, 0, this.baseHeight * this.scaleY);
    const width = props.width * this.scaleX;
    const height = props.height * this.scaleY;
    
    if (this.debug) console.log(`📦 Rendering rectangle at scaled (${x}, ${y}) size ${width}x${height}`);
    
    // Draw rectangle
    this.ctx.fillRect(x, y, width, height);
    
    // Add stroke if specified
    if (props.stroke && props.strokeWidth) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth;
      this.ctx.strokeRect(x, y, width, height);
    }
    
    // Restore canvas state
    this.ctx.restore();
  }

  renderEllipse(props) {
    // Save canvas state
    this.ctx.save();
    
    // Set styling properties
    this.ctx.fillStyle = props.fill || props.color || '#e74c3c';
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Apply responsive scaling to position and radii
    const x = this._clamp(props.x * this.scaleX, 0, this.baseWidth * this.scaleX);
    const y = this._clamp(props.y * this.scaleY, 0, this.baseHeight * this.scaleY);
    const radiusX = (props.radiusX || props.width / 2 || 50) * this.scaleX;
    const radiusY = (props.radiusY || props.height / 2 || 30) * this.scaleY;
    
    if (this.debug) console.log(`🥚 Rendering ellipse at scaled (${x}, ${y}) radii ${radiusX}x${radiusY}`);
    
    // Draw ellipse
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Add stroke if specified
    if (props.stroke && props.strokeWidth) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth;
      this.ctx.stroke();
    }
    
    // Restore canvas state
    this.ctx.restore();
  }

  renderPolygon(props) {
    // Save canvas state
    this.ctx.save();
    
    // Set styling properties
    this.ctx.fillStyle = props.fill || props.color || '#9b59b6';
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Get points array
    const points = props.points || [];
    if (points.length < 3) {
      console.warn('Polygon needs at least 3 points');
      this.ctx.restore();
      return;
    }
    
    if (this.debug) console.log(`🔷 Rendering polygon with ${points.length} points`);
    
    // Draw polygon
    this.ctx.beginPath();
    
    // Move to first point
    const firstPoint = points[0];
    const x1 = this._clamp(firstPoint.x * this.scaleX, 0, this.baseWidth * this.scaleX);
    const y1 = this._clamp(firstPoint.y * this.scaleY, 0, this.baseHeight * this.scaleY);
    this.ctx.moveTo(x1, y1);
    
    // Draw lines to remaining points
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const x = this._clamp(point.x * this.scaleX, 0, this.baseWidth * this.scaleX);
      const y = this._clamp(point.y * this.scaleY, 0, this.baseHeight * this.scaleY);
      this.ctx.lineTo(x, y);
    }
    
    this.ctx.closePath();
    this.ctx.fill();
    
    // Add stroke if specified
    if (props.stroke && props.strokeWidth) {
      this.ctx.strokeStyle = props.stroke;
      this.ctx.lineWidth = props.strokeWidth;
      this.ctx.stroke();
    }
    
    // Restore canvas state
    this.ctx.restore();
  }

  renderLine(props) {
    // Save canvas state
    this.ctx.save();
    
    // Set line styling properties
    this.ctx.strokeStyle = props.stroke || '#34495e';       // Line color (default gray)
    this.ctx.lineWidth = props.strokeWidth || 2;            // Line thickness
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1; // Transparency
    
    // NORMALIZATION: Convert LLM coordinates to canvas coordinates, then apply responsive scaling
    const normalizedX1 = this._normalizeCoordinate(props.x1, true);   // Normalize start X
    const normalizedY1 = this._normalizeCoordinate(props.y1, false);  // Normalize start Y
    const normalizedX2 = this._normalizeCoordinate(props.x2, true);   // Normalize end X
    const normalizedY2 = this._normalizeCoordinate(props.y2, false);  // Normalize end Y
    
    // Apply responsive scaling and clamping to both line endpoints
    const x1 = this._clamp(normalizedX1 * this.scaleX, 0, this.baseWidth * this.scaleX);   // Start X
    const y1 = this._clamp(normalizedY1 * this.scaleY, 0, this.baseHeight * this.scaleY); // Start Y  
    const x2 = this._clamp(normalizedX2 * this.scaleX, 0, this.baseWidth * this.scaleX);   // End X
    const y2 = this._clamp(normalizedY2 * this.scaleY, 0, this.baseHeight * this.scaleY); // End Y
    
    // Debug output showing line coordinates
    if (this.debug) console.log(`📏 Rendering line scaled (${x1}, ${y1}) -> (${x2}, ${y2}) from normalized (${normalizedX1}, ${normalizedY1}) -> (${normalizedX2}, ${normalizedY2}) from original (${props.x1}, ${props.y1}) -> (${props.x2}, ${props.y2})`);

    // Draw the line
    this.ctx.beginPath();                                   // Start new path
    this.ctx.moveTo(x1, y1);                               // Move to start point
    this.ctx.lineTo(x2, y2);                               // Draw line to end point
    this.ctx.stroke();                                     // Actually draw the line
    
    // Restore canvas state
    this.ctx.restore();
  }

  // UTILITY METHODS

  // Easing function for smooth animations (ease-in-out quadratic curve)
  // Input: t (0-1), Output: eased value (0-1) with smooth acceleration/deceleration
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Get current animation progress as percentage (0-1)  
  getProgress() {
    if (!this.visualization) return 0;
    return Math.min(this.currentTime / this.visualization.duration, 1);
  }

  // High-DPI / Retina display scaling for crisp rendering
  _applyHiDPIScaling() {
    const dpr = window.devicePixelRatio || 1;               // Get device pixel ratio
    const logicalWidth = this.canvas.width;                 // Current logical width
    const logicalHeight = this.canvas.height;               // Current logical height
    
    // Only apply scaling if device has high-DPI display
    if (dpr !== 1) {
      this.canvas.width = logicalWidth * dpr;               // Scale internal resolution
      this.canvas.height = logicalHeight * dpr;             // Scale internal resolution
      this.canvas.style.width = logicalWidth + 'px';        // Keep CSS size same
      this.canvas.style.height = logicalHeight + 'px';      // Keep CSS size same
      this.ctx.scale(dpr, dpr);                             // Scale drawing context
    }
  }

  // Toggle debug logging on/off
  setDebug(enabled) {
    this.debug = !!enabled;
  }

  // Configure normalization settings
  setNormalization(enabled, padding = 20) {
    this.normalizationEnabled = !!enabled;
    this.padding = Math.max(0, padding);
    
    if (this.debug) {
      console.log(`📐 Normalization ${enabled ? 'enabled' : 'disabled'}, padding: ${this.padding}px`);
    }
    
    // Recalculate bounds if visualization is loaded
    if (this.visualization && enabled) {
      this.normalizationBounds = this._calculateVisualizationBounds(this.visualization);
    }
  }

  // ======================================
  // ANIMATION EASING FUNCTIONS
  // ======================================
  
  // Linear interpolation (no easing)
  _easeLinear(t) {
    return t;
  }
  
  // Ease in (slow start)
  _easeInQuad(t) {
    return t * t;
  }
  
  // Ease out (slow end)
  _easeOutQuad(t) {
    return t * (2 - t);
  }
  
  // Ease in-out (slow start and end)
  _easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  // Cubic easing
  _easeInCubic(t) {
    return t * t * t;
  }
  
  _easeOutCubic(t) {
    return (--t) * t * t + 1;
  }
  
  // Elastic easing (bouncy)
  _easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
  
  // Bounce easing
  _easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
  
  // Get easing function by name
  _getEasingFunction(easingType) {
    const easingFunctions = {
      'linear': this._easeLinear,
      'ease-in': this._easeInQuad,
      'ease-out': this._easeOutQuad,
      'ease-in-out': this._easeInOutQuad,
      'ease-in-cubic': this._easeInCubic,
      'ease-out-cubic': this._easeOutCubic,
      'elastic': this._easeOutElastic,
      'bounce': this._easeOutBounce
    };
    
    return easingFunctions[easingType] || this._easeLinear;
  }
  
  // Apply easing to animation properties
  _applyEasing(startValue, endValue, progress, easingType = 'linear') {
    const easingFunc = this._getEasingFunction(easingType);
    const easedProgress = easingFunc.call(this, progress);
    return startValue + (endValue - startValue) * easedProgress;
  }

  // Utility function to constrain value within min/max bounds
  _clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Calculate bounds from visualization data for normalization
  _calculateVisualizationBounds(vizData) {
    if (!vizData || !vizData.layers) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    // Iterate through all layers and elements to find coordinate bounds
    for (const layer of vizData.layers) {
      if (!layer.elements) continue;
      
      for (const element of layer.elements) {
        const props = element.properties || {};
        
        // Extract coordinates based on element type
        switch (element.type) {
          case 'circle':
            if (props.x !== undefined && props.y !== undefined && props.r !== undefined) {
              minX = Math.min(minX, props.x - props.r);
              maxX = Math.max(maxX, props.x + props.r);
              minY = Math.min(minY, props.y - props.r);
              maxY = Math.max(maxY, props.y + props.r);
            }
            break;
            
          case 'arrow':
            if (props.x !== undefined && props.y !== undefined) {
              minX = Math.min(minX, props.x);
              maxX = Math.max(maxX, props.x);
              minY = Math.min(minY, props.y);
              maxY = Math.max(maxY, props.y);
              
              // Include arrow end point
              if (props.dx !== undefined && props.dy !== undefined) {
                const endX = props.x + props.dx;
                const endY = props.y + props.dy;
                minX = Math.min(minX, endX);
                maxX = Math.max(maxX, endX);
                minY = Math.min(minY, endY);
                maxY = Math.max(maxY, endY);
              }
            }
            break;
            
          case 'line':
            if (props.x1 !== undefined && props.y1 !== undefined && 
                props.x2 !== undefined && props.y2 !== undefined) {
              minX = Math.min(minX, props.x1, props.x2);
              maxX = Math.max(maxX, props.x1, props.x2);
              minY = Math.min(minY, props.y1, props.y2);
              maxY = Math.max(maxY, props.y1, props.y2);
            }
            break;
            
          case 'text':
          case 'label':
            if (props.x !== undefined && props.y !== undefined) {
              minX = Math.min(minX, props.x);
              maxX = Math.max(maxX, props.x);
              minY = Math.min(minY, props.y);
              maxY = Math.max(maxY, props.y);
            }
            break;
        }
      }
    }
    
    // Return null if no valid coordinates found
    if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
      return null;
    }
    
    const bounds = { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
    
    if (this.debug) {
      console.log('📊 Calculated visualization bounds:', bounds);
    }
    
    return bounds;
  }

  // Normalize coordinates from LLM data space to canvas space
  _normalizeCoordinate(value, isX = true) {
    if (!this.normalizationEnabled || !this.normalizationBounds) {
      return value; // No normalization - use original value
    }
    
    const bounds = this.normalizationBounds;
    const padding = this.padding;
    
    if (isX) {
      // Normalize X coordinate
      if (bounds.width === 0) return this.baseWidth / 2; // Center if no width variation
      const normalizedX = ((value - bounds.minX) / bounds.width) * (this.baseWidth - 2 * padding) + padding;
      return normalizedX;
    } else {
      // Normalize Y coordinate
      if (bounds.height === 0) return this.baseHeight / 2; // Center if no height variation
      const normalizedY = ((value - bounds.minY) / bounds.height) * (this.baseHeight - 2 * padding) + padding;
      return normalizedY;
    }
  }

  // Normalize size/radius values proportionally
  _normalizeSize(size) {
    if (!this.normalizationEnabled || !this.normalizationBounds) {
      return size; // No normalization - use original size
    }
    
    const bounds = this.normalizationBounds;
    const maxDimension = Math.max(bounds.width, bounds.height);
    const canvasMaxDimension = Math.max(this.baseWidth, this.baseHeight) - 2 * this.padding;
    
    if (maxDimension === 0) return size; // Avoid division by zero
    
    // Scale size proportionally to fit in canvas
    const scaleFactor = canvasMaxDimension / maxDimension;
    return size * scaleFactor;
  }

  // Utility function to parse hex/rgb colors into RGB components
  _parseColor(color) {
    // Handle hex colors (#RRGGBB or #RGB)
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return { r, g, b };
    }
    
    // Handle rgb() format
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    
    // Fallback to black
    return { r: 0, g: 0, b: 0 };
  }

  // Add more easing functions for variety
  easeInQuad(t) {
    return t * t;
  }

  easeOutQuad(t) {
    return t * (2 - t);
  }

  easeInCubic(t) {
    return t * t * t;
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ======================================
  // ADVANCED SHAPE RENDERERS
  // ======================================

  renderRectangle(props) {
    this.ctx.save();
    
    // Normalize coordinates and dimensions
    const normalizedX = this._normalizeCoordinate(props.x, true);
    const normalizedY = this._normalizeCoordinate(props.y, false);
    const normalizedWidth = this._normalizeSize(props.width);
    const normalizedHeight = this._normalizeSize(props.height);
    
    // Apply scaling
    const x = normalizedX * this.scaleX;
    const y = normalizedY * this.scaleY;
    const width = normalizedWidth * this.scaleX;
    const height = normalizedHeight * this.scaleY;
    
    // Set styles
    this.ctx.fillStyle = props.fill || '#3498db';
    this.ctx.strokeStyle = props.stroke || '#2c3e50';
    this.ctx.lineWidth = props.strokeWidth || 1;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Draw rectangle
    if (props.fill) this.ctx.fillRect(x, y, width, height);
    if (props.stroke) this.ctx.strokeRect(x, y, width, height);
    
    this.ctx.restore();
  }

  renderEllipse(props) {
    this.ctx.save();
    
    // Normalize coordinates and dimensions
    const normalizedX = this._normalizeCoordinate(props.x, true);
    const normalizedY = this._normalizeCoordinate(props.y, false);
    const normalizedRadiusX = this._normalizeSize(props.radiusX || props.rx || props.radius || 50);
    const normalizedRadiusY = this._normalizeSize(props.radiusY || props.ry || props.radius || 30);
    
    // Apply scaling
    const x = normalizedX * this.scaleX;
    const y = normalizedY * this.scaleY;
    const radiusX = normalizedRadiusX * this.scaleX;
    const radiusY = normalizedRadiusY * this.scaleY;
    
    // Set styles
    this.ctx.fillStyle = props.fill || '#3498db';
    this.ctx.strokeStyle = props.stroke || '#2c3e50';
    this.ctx.lineWidth = props.strokeWidth || 1;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Draw ellipse
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, radiusX, radiusY, props.rotation || 0, 0, 2 * Math.PI);
    
    if (props.fill) this.ctx.fill();
    if (props.stroke) this.ctx.stroke();
    
    this.ctx.restore();
  }

  renderPolygon(props) {
    this.ctx.save();
    
    if (!props.points || props.points.length < 3) {
      console.warn('Polygon requires at least 3 points');
      this.ctx.restore();
      return;
    }
    
    // Set styles
    this.ctx.fillStyle = props.fill || '#3498db';
    this.ctx.strokeStyle = props.stroke || '#2c3e50';
    this.ctx.lineWidth = props.strokeWidth || 1;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Draw polygon
    this.ctx.beginPath();
    
    // Normalize first point and move to it
    const firstPoint = props.points[0];
    const normalizedFirstX = this._normalizeCoordinate(firstPoint.x, true);
    const normalizedFirstY = this._normalizeCoordinate(firstPoint.y, false);
    this.ctx.moveTo(normalizedFirstX * this.scaleX, normalizedFirstY * this.scaleY);
    
    // Draw lines to remaining points
    for (let i = 1; i < props.points.length; i++) {
      const point = props.points[i];
      const normalizedX = this._normalizeCoordinate(point.x, true);
      const normalizedY = this._normalizeCoordinate(point.y, false);
      this.ctx.lineTo(normalizedX * this.scaleX, normalizedY * this.scaleY);
    }
    
    this.ctx.closePath();
    
    if (props.fill) this.ctx.fill();
    if (props.stroke) this.ctx.stroke();
    
    this.ctx.restore();
  }

  renderStar(props) {
    this.ctx.save();
    
    const normalizedCenterX = this._normalizeCoordinate(props.x, true);
    const normalizedCenterY = this._normalizeCoordinate(props.y, false);
    const normalizedOuterRadius = this._normalizeSize(props.outerRadius || 50);
    const normalizedInnerRadius = this._normalizeSize(props.innerRadius || 25);
    
    const centerX = normalizedCenterX * this.scaleX;
    const centerY = normalizedCenterY * this.scaleY;
    const outerRadius = normalizedOuterRadius * ((this.scaleX + this.scaleY) / 2);
    const innerRadius = normalizedInnerRadius * ((this.scaleX + this.scaleY) / 2);
    const points = props.points || 5;
    const rotation = props.rotation || 0;
    
    // Set styles
    this.ctx.fillStyle = props.fill || '#f1c40f';
    this.ctx.strokeStyle = props.stroke || '#f39c12';
    this.ctx.lineWidth = props.strokeWidth || 2;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Draw star
    this.ctx.beginPath();
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI / points) + rotation;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.closePath();
    
    if (props.fill) this.ctx.fill();
    if (props.stroke) this.ctx.stroke();
    
    this.ctx.restore();
  }

  renderWave(props) {
    this.ctx.save();
    
    const normalizedStartX = this._normalizeCoordinate(props.startX || 0, true);
    const normalizedStartY = this._normalizeCoordinate(props.startY || this.baseHeight / 2, false);
    const normalizedEndX = this._normalizeCoordinate(props.endX || this.baseWidth, true);
    const normalizedAmplitude = this._normalizeSize(props.amplitude || 20);
    
    const startX = normalizedStartX * this.scaleX;
    const startY = normalizedStartY * this.scaleY;
    const endX = normalizedEndX * this.scaleX;
    const amplitude = normalizedAmplitude * this.scaleY;
    const frequency = props.frequency || 0.02;
    const phase = props.phase || 0;
    
    // Set styles
    this.ctx.strokeStyle = props.stroke || '#3498db';
    this.ctx.lineWidth = props.strokeWidth || 3;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Draw wave
    this.ctx.beginPath();
    
    for (let x = startX; x <= endX; x += 2) {
      const progress = (x - startX) / (endX - startX);
      const y = startY + Math.sin(progress * frequency * 1000 + phase) * amplitude;
      
      if (x === startX) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  renderSpiral(props) {
    this.ctx.save();
    
    const normalizedCenterX = this._normalizeCoordinate(props.x, true);
    const normalizedCenterY = this._normalizeCoordinate(props.y, false);
    const normalizedMaxRadius = this._normalizeSize(props.maxRadius || 100);
    
    const centerX = normalizedCenterX * this.scaleX;
    const centerY = normalizedCenterY * this.scaleY;
    const maxRadius = normalizedMaxRadius * ((this.scaleX + this.scaleY) / 2);
    const turns = props.turns || 3;
    const startAngle = props.startAngle || 0;
    
    // Set styles
    this.ctx.strokeStyle = props.stroke || '#9b59b6';
    this.ctx.lineWidth = props.strokeWidth || 2;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Draw spiral
    this.ctx.beginPath();
    
    const steps = turns * 50;
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const angle = startAngle + progress * turns * 2 * Math.PI;
      const radius = progress * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  renderArc(props) {
    this.ctx.save();
    
    const normalizedCenterX = this._normalizeCoordinate(props.x, true);
    const normalizedCenterY = this._normalizeCoordinate(props.y, false);
    const normalizedRadius = this._normalizeSize(props.radius || 50);
    
    const centerX = normalizedCenterX * this.scaleX;
    const centerY = normalizedCenterY * this.scaleY;
    const radius = normalizedRadius * ((this.scaleX + this.scaleY) / 2);
    const startAngle = props.startAngle || 0;
    const endAngle = props.endAngle || Math.PI;
    const counterclockwise = props.counterclockwise || false;
    
    // Set styles
    this.ctx.fillStyle = props.fill || '#e74c3c';
    this.ctx.strokeStyle = props.stroke || '#c0392b';
    this.ctx.lineWidth = props.strokeWidth || 2;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Draw arc
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, startAngle, endAngle, counterclockwise);
    
    if (props.sector) {
      // Draw as pie slice
      this.ctx.lineTo(centerX, centerY);
      this.ctx.closePath();
    }
    
    if (props.fill) this.ctx.fill();
    if (props.stroke) this.ctx.stroke();
    
    this.ctx.restore();
  }

  renderBezier(props) {
    this.ctx.save();
    
    if (!props.startPoint || !props.endPoint) {
      console.warn('Bezier curve requires startPoint and endPoint');
      this.ctx.restore();
      return;
    }
    
    // Normalize all points
    const normalizedStartX = this._normalizeCoordinate(props.startPoint.x, true);
    const normalizedStartY = this._normalizeCoordinate(props.startPoint.y, false);
    const normalizedEndX = this._normalizeCoordinate(props.endPoint.x, true);
    const normalizedEndY = this._normalizeCoordinate(props.endPoint.y, false);
    
    const startX = normalizedStartX * this.scaleX;
    const startY = normalizedStartY * this.scaleY;
    const endX = normalizedEndX * this.scaleX;
    const endY = normalizedEndY * this.scaleY;
    
    // Set styles
    this.ctx.strokeStyle = props.stroke || '#2ecc71';
    this.ctx.lineWidth = props.strokeWidth || 3;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Draw bezier curve
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    
    if (props.controlPoint1 && props.controlPoint2) {
      // Cubic bezier
      const normalizedCP1X = this._normalizeCoordinate(props.controlPoint1.x, true);
      const normalizedCP1Y = this._normalizeCoordinate(props.controlPoint1.y, false);
      const normalizedCP2X = this._normalizeCoordinate(props.controlPoint2.x, true);
      const normalizedCP2Y = this._normalizeCoordinate(props.controlPoint2.y, false);
      
      const cp1X = normalizedCP1X * this.scaleX;
      const cp1Y = normalizedCP1Y * this.scaleY;
      const cp2X = normalizedCP2X * this.scaleX;
      const cp2Y = normalizedCP2Y * this.scaleY;
      
      this.ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
    } else if (props.controlPoint1) {
      // Quadratic bezier
      const normalizedCPX = this._normalizeCoordinate(props.controlPoint1.x, true);
      const normalizedCPY = this._normalizeCoordinate(props.controlPoint1.y, false);
      
      const cpX = normalizedCPX * this.scaleX;
      const cpY = normalizedCPY * this.scaleY;
      
      this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    } else {
      // Simple line if no control points
      this.ctx.lineTo(endX, endY);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }

  renderParticle(props) {
    this.ctx.save();
    
    // Handle particle system
    const particles = props.particles || [{ x: props.x, y: props.y, size: props.size || 3 }];
    
    particles.forEach((particle, index) => {
      const normalizedX = this._normalizeCoordinate(particle.x, true);
      const normalizedY = this._normalizeCoordinate(particle.y, false);
      const normalizedSize = this._normalizeSize(particle.size || 3);
      
      const x = normalizedX * this.scaleX;
      const y = normalizedY * this.scaleY;
      const size = normalizedSize * ((this.scaleX + this.scaleY) / 2);
      
      // Set particle appearance
      const opacity = particle.opacity !== undefined ? particle.opacity : 
                     (props.opacity !== undefined ? props.opacity : 0.7);
      const color = particle.color || props.color || '#fff';
      
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = opacity;
      
      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, 2 * Math.PI);
      this.ctx.fill();
    });
    
    this.ctx.restore();
  }

  renderGradient(props) {
    this.ctx.save();
    
    // Create gradient
    let gradient;
    
    if (props.type === 'radial') {
      const normalizedCenterX = this._normalizeCoordinate(props.x, true);
      const normalizedCenterY = this._normalizeCoordinate(props.y, false);
      const normalizedRadius = this._normalizeSize(props.radius || 100);
      
      const centerX = normalizedCenterX * this.scaleX;
      const centerY = normalizedCenterY * this.scaleY;
      const radius = normalizedRadius * ((this.scaleX + this.scaleY) / 2);
      
      gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    } else {
      // Linear gradient
      const normalizedStartX = this._normalizeCoordinate(props.startX || 0, true);
      const normalizedStartY = this._normalizeCoordinate(props.startY || 0, false);
      const normalizedEndX = this._normalizeCoordinate(props.endX || this.baseWidth, true);
      const normalizedEndY = this._normalizeCoordinate(props.endY || 0, false);
      
      const startX = normalizedStartX * this.scaleX;
      const startY = normalizedStartY * this.scaleY;
      const endX = normalizedEndX * this.scaleX;
      const endY = normalizedEndY * this.scaleY;
      
      gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
    }
    
    // Add color stops
    if (props.colorStops) {
      props.colorStops.forEach(stop => {
        gradient.addColorStop(stop.offset, stop.color);
      });
    } else {
      gradient.addColorStop(0, props.startColor || '#3498db');
      gradient.addColorStop(1, props.endColor || '#2c3e50');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Fill shape with gradient
    if (props.shape === 'circle') {
      const normalizedX = this._normalizeCoordinate(props.x, true);
      const normalizedY = this._normalizeCoordinate(props.y, false);
      const normalizedRadius = this._normalizeSize(props.radius || 50);
      
      const x = normalizedX * this.scaleX;
      const y = normalizedY * this.scaleY;
      const radius = normalizedRadius * ((this.scaleX + this.scaleY) / 2);
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
      this.ctx.fill();
    } else {
      // Rectangle by default
      const normalizedX = this._normalizeCoordinate(props.x || 0, true);
      const normalizedY = this._normalizeCoordinate(props.y || 0, false);
      const normalizedWidth = this._normalizeSize(props.width || this.baseWidth);
      const normalizedHeight = this._normalizeSize(props.height || this.baseHeight);
      
      const x = normalizedX * this.scaleX;
      const y = normalizedY * this.scaleY;
      const width = normalizedWidth * this.scaleX;
      const height = normalizedHeight * this.scaleY;
      
      this.ctx.fillRect(x, y, width, height);
    }
    
    this.ctx.restore();
  }

  renderPath(props) {
    this.ctx.save();
    
    if (!props.commands || props.commands.length === 0) {
      console.warn('Path requires commands array');
      this.ctx.restore();
      return;
    }
    
    // Set styles
    this.ctx.fillStyle = props.fill || 'transparent';
    this.ctx.strokeStyle = props.stroke || '#2c3e50';
    this.ctx.lineWidth = props.strokeWidth || 2;
    this.ctx.globalAlpha = props.opacity !== undefined ? props.opacity : 1;
    
    // Execute path commands
    this.ctx.beginPath();
    
    props.commands.forEach(cmd => {
      switch (cmd.type) {
        case 'moveTo':
          const normalizedMoveX = this._normalizeCoordinate(cmd.x, true);
          const normalizedMoveY = this._normalizeCoordinate(cmd.y, false);
          this.ctx.moveTo(normalizedMoveX * this.scaleX, normalizedMoveY * this.scaleY);
          break;
          
        case 'lineTo':
          const normalizedLineX = this._normalizeCoordinate(cmd.x, true);
          const normalizedLineY = this._normalizeCoordinate(cmd.y, false);
          this.ctx.lineTo(normalizedLineX * this.scaleX, normalizedLineY * this.scaleY);
          break;
          
        case 'arc':
          const normalizedArcX = this._normalizeCoordinate(cmd.x, true);
          const normalizedArcY = this._normalizeCoordinate(cmd.y, false);
          const normalizedArcRadius = this._normalizeSize(cmd.radius);
          this.ctx.arc(
            normalizedArcX * this.scaleX,
            normalizedArcY * this.scaleY,
            normalizedArcRadius * ((this.scaleX + this.scaleY) / 2),
            cmd.startAngle,
            cmd.endAngle
          );
          break;
          
        case 'closePath':
          this.ctx.closePath();
          break;
      }
    });
    
    if (props.fill && props.fill !== 'transparent') this.ctx.fill();
    if (props.stroke) this.ctx.stroke();
    
    this.ctx.restore();
  }
}


