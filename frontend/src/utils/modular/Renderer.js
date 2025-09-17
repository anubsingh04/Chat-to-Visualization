/**
 * Renderer Class - Optimized Canvas Rendering System
 * 
 * This class handles efficient rendering of shapes to canvas with
 * performance optimizations including viewport culling, dirty regions,
 * layer management, and render batching.
 */
export class Renderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Rendering configuration
    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;
    this.backgroundColor = options.backgroundColor || 'transparent';
    this.enableAntialias = options.enableAntialias !== false;
    this.enableOptimization = options.enableOptimization !== false;
    this.debugMode = options.debugMode || false;
    
    // Viewport management
    this.viewport = {
      x: 0,
      y: 0,
      width: canvas.width / this.pixelRatio,
      height: canvas.height / this.pixelRatio,
      scale: 1
    };
    
    // Performance optimization
    this.dirtyRegions = [];                    // Regions that need redrawing
    this.enableDirtyRegions = options.enableDirtyRegions || false;
    this.lastRenderTime = 0;                   // Performance tracking
    this.renderCount = 0;                      // Total renders
    this.culledObjects = 0;                    // Objects culled this frame
    
    // Layer management
    this.layers = new Map();                   // Named layers for z-ordering
    this.defaultLayer = 'default';
    this.layers.set(this.defaultLayer, []);
    
    // Render batching
    this.batchedShapes = [];                   // Shapes to render in current batch
    this.maxBatchSize = options.maxBatchSize || 100;
    
    // Canvas state stack for transformations
    this.transformStack = [];
    
    // Initialize canvas settings
    this.initializeCanvas();
  }
  
  /**
   * Initialize canvas with proper scaling and settings
   * @private
   */
  initializeCanvas() {
    // Set up high-DPI rendering
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.pixelRatio;
    this.canvas.height = rect.height * this.pixelRatio;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    
    // Scale context for high-DPI
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    
    // Set rendering quality
    this.ctx.imageSmoothingEnabled = this.enableAntialias;
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';
    
    // Update viewport
    this.viewport.width = rect.width;
    this.viewport.height = rect.height;
  }
  
  /**
   * Resize canvas and update viewport
   * 
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    this.ctx.imageSmoothingEnabled = this.enableAntialias;
    
    this.viewport.width = width;
    this.viewport.height = height;
    
    // Clear any dirty regions since we're doing a full redraw
    this.dirtyRegions = [];
    this.addDirtyRegion(0, 0, width, height);
  }
  
  /**
   * Set viewport transformation (pan/zoom)
   * 
   * @param {number} x - X offset
   * @param {number} y - Y offset
   * @param {number} scale - Scale factor
   */
  setViewport(x, y, scale = 1) {
    this.viewport.x = x;
    this.viewport.y = y;
    this.viewport.scale = scale;
    
    // Mark entire canvas as dirty since viewport changed
    this.addDirtyRegion(0, 0, this.viewport.width, this.viewport.height);
  }
  
  /**
   * Add a shape to a specific layer
   * 
   * @param {Shape} shape - Shape to add
   * @param {string} [layer] - Layer name (defaults to 'default')
   */
  addToLayer(shape, layer = this.defaultLayer) {
    console.log(`🎨 [Renderer] Adding shape ${shape.type} (id: ${shape.id || 'no-id'}) to layer "${layer}"`);
    
    if (!this.layers.has(layer)) {
      console.log(`🎨 [Renderer] Creating new layer "${layer}"`);
      this.layers.set(layer, []);
    }
    
    const layerShapes = this.layers.get(layer);
    if (!layerShapes.includes(shape)) {
      layerShapes.push(shape);
      console.log(`🎨 [Renderer] ✅ Shape added to layer "${layer}". Layer now has ${layerShapes.length} shapes`);
    } else {
      console.log(`🎨 [Renderer] ⚠️ Shape already exists in layer "${layer}"`);
    }
    
    console.log(`🎨 [Renderer] Total layers:`, Array.from(this.layers.keys()));
    console.log(`🎨 [Renderer] Layer shapes count:`, Array.from(this.layers.entries()).map(([name, shapes]) => [name, shapes.length]));
  }
  
  /**
   * Remove a shape from a layer
   * 
   * @param {Shape} shape - Shape to remove
   * @param {string} [layer] - Layer name
   */
  removeFromLayer(shape, layer = this.defaultLayer) {
    if (this.layers.has(layer)) {
      const layerShapes = this.layers.get(layer);
      const index = layerShapes.indexOf(shape);
      if (index !== -1) {
        layerShapes.splice(index, 1);
        
        // Mark shape's bounds as dirty
        const bounds = shape.getBounds();
        if (bounds) {
          this.addDirtyRegion(bounds.x, bounds.y, bounds.width, bounds.height);
        }
      }
    }
  }
  
  /**
   * Clear all shapes from a layer
   * 
   * @param {string} [layer] - Layer name
   */
  clearLayer(layer = this.defaultLayer) {
    if (this.layers.has(layer)) {
      this.layers.get(layer).length = 0;
      // Mark entire canvas as dirty
      this.addDirtyRegion(0, 0, this.viewport.width, this.viewport.height);
    }
  }
  
  /**
   * Add a dirty region that needs redrawing
   * 
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate  
   * @param {number} width - Width
   * @param {number} height - Height
   */
  addDirtyRegion(x, y, width, height) {
    if (!this.enableDirtyRegions) return;
    
    // Transform coordinates to viewport space
    const viewX = (x - this.viewport.x) * this.viewport.scale;
    const viewY = (y - this.viewport.y) * this.viewport.scale;
    const viewWidth = width * this.viewport.scale;
    const viewHeight = height * this.viewport.scale;
    
    // Clamp to canvas bounds
    const clampedX = Math.max(0, viewX);
    const clampedY = Math.max(0, viewY);
    const clampedWidth = Math.min(this.viewport.width - clampedX, viewWidth);
    const clampedHeight = Math.min(this.viewport.height - clampedY, viewHeight);
    
    if (clampedWidth > 0 && clampedHeight > 0) {
      this.dirtyRegions.push({
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight
      });
    }
  }
  
  /**
   * Check if a shape is visible in current viewport
   * 
   * @param {Shape} shape - Shape to check
   * @returns {boolean} True if visible
   */
  isVisible(shape) {
    if (!this.enableOptimization) {
      console.log(`🎨 [Renderer] Shape ${shape.type} visible (optimization disabled)`);
      return true;
    }
    
    const bounds = shape.getBounds();
    if (!bounds) {
      console.log(`🎨 [Renderer] Shape ${shape.type} visible (no bounds)`);
      return true;
    }
    
    // Transform bounds to viewport space
    const viewLeft = (bounds.x - this.viewport.x) * this.viewport.scale;
    const viewTop = (bounds.y - this.viewport.y) * this.viewport.scale;
    const viewRight = viewLeft + (bounds.width * this.viewport.scale);
    const viewBottom = viewTop + (bounds.height * this.viewport.scale);
    
    // Check if bounds intersect with viewport
    const isVisible = !(viewRight < 0 || 
             viewLeft > this.viewport.width || 
             viewBottom < 0 || 
             viewTop > this.viewport.height);
             
    console.log(`🎨 [Renderer] Shape ${shape.type} bounds:`, bounds);
    console.log(`🎨 [Renderer] Viewport:`, this.viewport);
    console.log(`🎨 [Renderer] View bounds: [${viewLeft}, ${viewTop}, ${viewRight}, ${viewBottom}]`);
    console.log(`🎨 [Renderer] Shape ${shape.type} visible:`, isVisible);
    
    return isVisible;
  }
  
  /**
   * Apply viewport transformation to context
   * @private
   */
  applyViewportTransform() {
    this.ctx.save();
    this.ctx.scale(this.viewport.scale, this.viewport.scale);
    this.ctx.translate(-this.viewport.x, -this.viewport.y);
  }
  
  /**
   * Restore context from viewport transformation
   * @private
   */
  restoreViewportTransform() {
    this.ctx.restore();
  }
  
  /**
   * Clear the canvas or specific regions
   * 
   * @param {boolean} [fullClear] - Force full clear
   */
  clear(fullClear = false) {
    if (fullClear || !this.enableDirtyRegions || this.dirtyRegions.length === 0) {
      // Full clear
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
      
      if (this.backgroundColor === 'transparent') {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      } else {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      
      this.ctx.restore();
    } else {
      // Clear dirty regions only
      this.ctx.save();
      for (const region of this.dirtyRegions) {
        if (this.backgroundColor === 'transparent') {
          this.ctx.clearRect(region.x, region.y, region.width, region.height);
        } else {
          this.ctx.fillStyle = this.backgroundColor;
          this.ctx.fillRect(region.x, region.y, region.width, region.height);
        }
      }
      this.ctx.restore();
    }
  }
  
  /**
   * Render all shapes in all layers
   * 
   * @param {Array} [shapes] - Optional specific shapes to render
   * @param {boolean} [force] - Force full redraw
   */
  render(shapes = null, force = false) {
    const startTime = performance.now();
    this.culledObjects = 0;
    
    console.log('🎨 [Renderer] Starting render cycle');
    console.log('🎨 [Renderer] Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
    console.log('🎨 [Renderer] Shapes to render:', shapes ? shapes.length : 'all layers');
    
    // Clear canvas (smart clearing based on dirty regions)
    this.clear(force);
    
    // Apply viewport transformation
    this.applyViewportTransform();
    
    if (shapes) {
      // Render specific shapes
      console.log('🎨 [Renderer] Rendering specific shapes:', shapes.length);
      this.renderShapes(shapes);
    } else {
      // Render all layers in order
      const layerNames = Array.from(this.layers.keys()).sort();
      console.log('🎨 [Renderer] Available layers:', layerNames);
      
      for (const layerName of layerNames) {
        const layerShapes = this.layers.get(layerName);
        console.log(`🎨 [Renderer] Layer "${layerName}" has ${layerShapes ? layerShapes.length : 0} shapes`);
        if (layerShapes && layerShapes.length > 0) {
          this.renderShapes(layerShapes);
        }
      }
    }
    
    // Restore viewport transformation
    this.restoreViewportTransform();
    
    // Debug rendering if enabled
    if (this.debugMode) {
      this.renderDebugInfo();
    }
    
    // Clear dirty regions for next frame
    this.dirtyRegions = [];
    
    // Update performance metrics
    this.lastRenderTime = performance.now() - startTime;
    this.renderCount++;
  }
  
  /**
   * Render an array of shapes
   * @private
   */
  renderShapes(shapes) {
    if (!shapes || shapes.length === 0) {
      console.log('🎨 [Renderer] No shapes to render');
      return;
    }
    
    console.log(`🎨 [Renderer] Rendering ${shapes.length} shapes`);
    
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      console.log(`🎨 [Renderer] Rendering shape ${i + 1}/${shapes.length}:`, shape.type, shape.id || 'no-id');
      
      if (this.isVisible(shape)) {
        try {
          // Get current properties from shape
          const props = shape.getCurrentProperties();
          console.log(`🎨 [Renderer] Shape properties:`, props);
          
          // Apply shape-specific transform if needed
          if (props.transform) {
            this.ctx.save();
            this.applyTransform(props.transform);
          }
          
          // Render the shape
          console.log(`🎨 [Renderer] Calling shape.render() for ${shape.type}`);
          shape.render(this.ctx);
          console.log(`🎨 [Renderer] ✅ Shape rendered successfully`);
          
          // Restore transform
          if (props.transform) {
            this.ctx.restore();
          }
          
        } catch (error) {
          console.warn('❌ [Renderer] Error rendering shape:', error);
        }
      } else {
        this.culledObjects++;
      }
    }
  }
  
  /**
   * Apply a transformation to the context
   * @private
   */
  applyTransform(transform) {
    if (transform.translate) {
      this.ctx.translate(transform.translate.x || 0, transform.translate.y || 0);
    }
    
    if (transform.rotate) {
      this.ctx.rotate(transform.rotate);
    }
    
    if (transform.scale) {
      const scaleX = transform.scale.x !== undefined ? transform.scale.x : transform.scale;
      const scaleY = transform.scale.y !== undefined ? transform.scale.y : transform.scale;
      this.ctx.scale(scaleX, scaleY);
    }
  }
  
  /**
   * Render debug information
   * @private
   */
  renderDebugInfo() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for UI overlay
    
    // Debug text styling
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(10, 10, 200, 100);
    this.ctx.fillStyle = 'black';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    // Debug information
    const debugInfo = [
      `Render Time: ${this.lastRenderTime.toFixed(2)}ms`,
      `Render Count: ${this.renderCount}`,
      `Culled Objects: ${this.culledObjects}`,
      `Dirty Regions: ${this.dirtyRegions.length}`,
      `Viewport: ${this.viewport.x.toFixed(0)}, ${this.viewport.y.toFixed(0)}, ${this.viewport.scale.toFixed(2)}x`,
      `Canvas: ${this.viewport.width}x${this.viewport.height}`
    ];
    
    debugInfo.forEach((line, index) => {
      this.ctx.fillText(line, 15, 15 + (index * 14));
    });
    
    // Draw dirty regions
    if (this.dirtyRegions.length > 0) {
      this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      this.ctx.lineWidth = 1;
      
      for (const region of this.dirtyRegions) {
        this.ctx.strokeRect(region.x, region.y, region.width, region.height);
      }
    }
    
    this.ctx.restore();
  }
  
  /**
   * Get performance statistics
   * 
   * @returns {Object} Performance metrics
   */
  getPerformanceStats() {
    return {
      lastRenderTime: this.lastRenderTime,
      renderCount: this.renderCount,
      culledObjects: this.culledObjects,
      dirtyRegions: this.dirtyRegions.length,
      averageRenderTime: this.renderCount > 0 ? this.lastRenderTime : 0,
      viewport: { ...this.viewport }
    };
  }
  
  /**
   * Take a screenshot of the current canvas
   * 
   * @param {string} [format] - Image format ('image/png', 'image/jpeg')
   * @param {number} [quality] - Image quality (0-1, for JPEG)
   * @returns {string} Data URL of the image
   */
  screenshot(format = 'image/png', quality = 0.92) {
    return this.canvas.toDataURL(format, quality);
  }
  
  /**
   * Export canvas as blob
   * 
   * @param {Function} callback - Callback with blob parameter
   * @param {string} [format] - Image format
   * @param {number} [quality] - Image quality
   */
  exportBlob(callback, format = 'image/png', quality = 0.92) {
    this.canvas.toBlob(callback, format, quality);
  }
  
  /**
   * Enable or disable optimization features
   * 
   * @param {Object} options - Optimization options
   */
  setOptimizations(options) {
    if ('enableOptimization' in options) {
      this.enableOptimization = options.enableOptimization;
    }
    
    if ('enableDirtyRegions' in options) {
      this.enableDirtyRegions = options.enableDirtyRegions;
    }
    
    if ('enableAntialias' in options) {
      this.enableAntialias = options.enableAntialias;
      this.ctx.imageSmoothingEnabled = this.enableAntialias;
    }
  }
  
  /**
   * Get current canvas dimensions
   * 
   * @returns {Object} Width and height
   */
  getDimensions() {
    return {
      width: this.viewport.width,
      height: this.viewport.height,
      pixelWidth: this.canvas.width,
      pixelHeight: this.canvas.height,
      pixelRatio: this.pixelRatio
    };
  }
  
  /**
   * Convert screen coordinates to world coordinates
   * 
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX / this.viewport.scale) + this.viewport.x,
      y: (screenY / this.viewport.scale) + this.viewport.y
    };
  }
  
  /**
   * Convert world coordinates to screen coordinates
   * 
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.viewport.x) * this.viewport.scale,
      y: (worldY - this.viewport.y) * this.viewport.scale
    };
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    // Clear all layers
    this.layers.clear();
    this.dirtyRegions = [];
    this.batchedShapes = [];
    this.transformStack = [];
    
    // Clear canvas
    this.clear(true);
  }
}