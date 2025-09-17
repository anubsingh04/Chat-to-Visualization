/**
 * Base Shape Class - Foundation for all renderable shapes
 * 
 * This abstract class defines the interface that all shapes must implement.
 * It handles common functionality like property management, bounds calculation,
 * and viewport visibility checking.
 */
export class Shape {
  static type = 'base';
  
  constructor(id, props = {}) {
    this.id = id;                           // Unique identifier for this shape
    this.type = this.constructor.type;      // Shape type (circle, arrow, etc.)
    this.props = { ...props };              // Static properties (initial values)
    this.animated = {};                     // Current animated property values
    this.visible = true;                    // Visibility flag
    this.zIndex = props.zIndex || 0;        // Rendering order (higher = on top)
    
    // Performance optimization: cache bounds calculation
    this._boundsCache = null;
    this._boundsCacheDirty = true;
  }
  
  /**
   * Render this shape to the canvas context
   * Must be implemented by each shape subclass
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} transform - Current scaling/translation transform
   */
  render(ctx, transform) {
    throw new Error(`Shape "${this.type}" must implement render() method`);
  }
  
  /**
   * Get current effective properties (static + animated)
   * Animated properties override static ones
   * 
   * @returns {Object} Combined properties object
   */
  getCurrentProperties() {
    return {
      ...this.props,        // Start with static properties
      ...this.animated      // Override with animated values
    };
  }
  
  /**
   * Update an animated property value
   * Marks bounds cache as dirty for recalculation
   * 
   * @param {string} property - Property name
   * @param {*} value - New property value
   */
  setAnimatedProperty(property, value) {
    this.animated[property] = value;
    this._boundsCacheDirty = true;
  }
  
  /**
   * Get bounding box for this shape
   * Used for viewport culling and collision detection
   * 
   * @returns {Object} Bounds { x, y, width, height }
   */
  getBounds() {
    if (!this._boundsCacheDirty && this._boundsCache) {
      return this._boundsCache;
    }
    
    const props = this.getCurrentProperties();
    this._boundsCache = this.calculateBounds(props);
    this._boundsCacheDirty = false;
    
    return this._boundsCache;
  }
  
  /**
   * Calculate bounding box based on current properties
   * Must be implemented by each shape subclass
   * 
   * @param {Object} props - Current shape properties
   * @returns {Object} Bounds { x, y, width, height }
   */
  calculateBounds(props) {
    throw new Error(`Shape "${this.type}" must implement calculateBounds() method`);
  }
  
  /**
   * Check if shape is visible within given viewport
   * Used for performance optimization (viewport culling)
   * 
   * @param {Object} viewport - Viewport bounds { x, y, width, height }
   * @returns {boolean} True if shape should be rendered
   */
  isVisible(viewport) {
    if (!this.visible) return false;
    
    const bounds = this.getBounds();
    
    // Check if bounding boxes intersect
    return !(bounds.x > viewport.x + viewport.width ||
             bounds.x + bounds.width < viewport.x ||
             bounds.y > viewport.y + viewport.height ||
             bounds.y + bounds.height < viewport.y);
  }
  
  /**
   * Apply responsive scaling to coordinates
   * Converts from logical coordinates to actual canvas coordinates
   * 
   * @param {Object} transform - Scaling factors { scaleX, scaleY, baseWidth, baseHeight }
   * @param {number} x - Logical X coordinate
   * @param {number} y - Logical Y coordinate
   * @returns {Object} Scaled coordinates { x, y }
   */
  applyTransform(transform, x, y) {
    return {
      x: this.clamp(x * transform.scaleX, 0, transform.baseWidth * transform.scaleX),
      y: this.clamp(y * transform.scaleY, 0, transform.baseHeight * transform.scaleY)
    };
  }
  
  /**
   * Utility function to clamp value within bounds
   * 
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {number} Clamped value
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  
  /**
   * Set visibility of this shape
   * 
   * @param {boolean} visible - Whether shape should be visible
   */
  setVisible(visible) {
    this.visible = visible;
  }
  
  /**
   * Reset all animated properties back to static values
   */
  resetAnimatedProperties() {
    this.animated = {};
    this._boundsCacheDirty = true;
  }
  
  /**
   * Create a deep copy of this shape
   * Useful for creating variations or templates
   * 
   * @returns {Shape} New shape instance with same properties
   */
  clone() {
    const CloneClass = this.constructor;
    const cloned = new CloneClass(this.id + '_clone', { ...this.props });
    cloned.animated = { ...this.animated };
    cloned.visible = this.visible;
    cloned.zIndex = this.zIndex;
    return cloned;
  }
}

/**
 * Shape Registry - Manages available shape types
 * 
 * Allows dynamic registration of new shape types and creation of shapes
 * from JSON specifications (like from AI-generated visualizations)
 */
export class ShapeRegistry {
  static shapes = new Map();
  
  /**
   * Register a new shape type
   * 
   * @param {string} type - Shape type identifier
   * @param {Class} shapeClass - Shape class constructor
   */
  static register(type, shapeClass) {
    if (!shapeClass.prototype instanceof Shape) {
      throw new Error(`Shape class must extend Shape base class`);
    }
    
    this.shapes.set(type, shapeClass);
    console.log(`📝 Registered shape type: ${type}`);
  }
  
  /**
   * Create a shape instance from JSON specification
   * 
   * @param {Object} spec - Shape specification { type, id, properties, ... }
   * @returns {Shape} New shape instance
   */
  static create(spec) {
    console.log('🏭 ShapeRegistry.create called with:', spec);
    console.log('🏭 Available shape types:', Array.from(this.shapes.keys()));
    
    const ShapeClass = this.shapes.get(spec.type);
    
    if (!ShapeClass) {
      console.warn(`⚠️ Unknown shape type: ${spec.type}, available: ${Array.from(this.shapes.keys()).join(', ')}`);
      return null;
    }
    
    // Use either 'properties' or 'props' for backward compatibility
    const props = spec.properties || spec.props || {};
    console.log('🏭 Creating shape with props:', props);
    
    const shape = new ShapeClass(spec.id || `${spec.type}_${Date.now()}`, props);
    console.log('🏭 Shape created successfully:', shape);
    
    return shape;
  }
  
  /**
   * Get all registered shape types
   * 
   * @returns {Array<string>} List of available shape types
   */
  static getAvailableTypes() {
    return Array.from(this.shapes.keys());
  }
  
  /**
   * Check if a shape type is registered
   * 
   * @param {string} type - Shape type to check
   * @returns {boolean} True if type is registered
   */
  static isRegistered(type) {
    return this.shapes.has(type);
  }
}