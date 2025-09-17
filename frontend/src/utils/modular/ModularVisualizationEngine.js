import { ShapeRegistry } from './Shape.js';
import { Timeline } from './Timeline.js';
import { AnimationManager, PropertyAnimator, OrbitAnimator, PathAnimator } from './Animation.js';
import { Renderer } from './Renderer.js';

// Import all shape types
import './shapes/index.js';

/**
 * ModularVisualizationEngine - Main orchestration class
 * 
 * This class coordinates all subsystems (shapes, animations, timeline, renderer)
 * and provides the main API interface for the modular visualization system.
 * It's designed to work with JSON specifications from AI-generated content.
 */
export class ModularVisualizationEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.isInitialized = false;
    
    // Configuration
    this.options = {
      fps: 60,
      duration: 5000,
      loop: false,
      autoPlay: false,
      backgroundColor: 'transparent',
      enableOptimization: true,
      enableDirtyRegions: false, // Can cause issues with complex animations
      debugMode: false,
      ...options
    };
    
    // Core systems
    this.timeline = null;
    this.renderer = null;
    this.animationManager = null;
    this.shapeRegistry = ShapeRegistry; // Use static class directly
    
    // Current visualization state
    this.shapes = [];
    this.animations = [];
    this.currentSpec = null;
    
    // Event callbacks
    this.onReady = options.onReady || null;
    this.onStart = options.onStart || null;
    this.onComplete = options.onComplete || null;
    this.onError = options.onError || null;
    this.onFrame = options.onFrame || null;
    
    // Performance tracking
    this.stats = {
      totalFrames: 0,
      totalRenderTime: 0,
      lastFPS: 0,
      averageRenderTime: 0
    };
    
    // Initialize systems
    this.initializeSystems();
  }
  
  /**
   * Initialize all subsystems
   * @private
   */
  initializeSystems() {
    try {
      // Create renderer
      this.renderer = new Renderer(this.canvas, {
        backgroundColor: this.options.backgroundColor,
        enableOptimization: this.options.enableOptimization,
        enableDirtyRegions: this.options.enableDirtyRegions,
        debugMode: this.options.debugMode
      });
      
      // Create timeline
      this.timeline = new Timeline({
        duration: this.options.duration,
        fps: this.options.fps,
        loop: this.options.loop,
        autoPlay: false, // We control this manually
        onStart: () => this.handleTimelineStart(),
        onComplete: () => this.handleTimelineComplete(),
        onUpdate: (timeline, currentTime) => this.handleFrame(currentTime)
      });
      
      // Create animation manager
      this.animationManager = new AnimationManager();
      
      this.isInitialized = true;
      
      if (this.onReady) {
        this.onReady(this);
      }
      
    } catch (error) {
      console.error('Failed to initialize ModularVisualizationEngine:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }
  
  /**
   * Load visualization from JSON specification
   * 
   * @param {Object} spec - JSON specification
   * @returns {Promise<void>} Promise that resolves when loaded
   */
  async loadFromSpec(spec) {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized');
    }
    
    try {
      // Clear current state
      this.clear();
      
      // Store spec for reference
      this.currentSpec = { ...spec };
      
      // Update timeline settings from spec
      this.timeline.setDuration(spec.duration || this.options.duration);
      this.timeline.setFPS(spec.fps || this.options.fps);
      this.timeline.setLoop(spec.loop || this.options.loop);
      
      // Create shapes from spec
      if (spec.shapes) {
        await this.createShapesFromSpec(spec.shapes);
      }
      
      // Create animations from spec
      if (spec.animations) {
        await this.createAnimationsFromSpec(spec.animations);
      }
      
      // Initial render
      this.render();
      
      // Auto-play if requested
      if (spec.autoPlay || this.options.autoPlay) {
        this.play();
      }
      
    } catch (error) {
      console.error('Failed to load visualization spec:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }
  
  /**
   * Create shapes from specification
   * @private
   */
  async createShapesFromSpec(shapesSpec) {
    console.log('🎨 Creating shapes from spec:', shapesSpec);
    
    for (const shapeSpec of shapesSpec) {
      try {
        console.log('🔧 Creating shape:', shapeSpec);
        const shape = this.shapeRegistry.create(shapeSpec);
        console.log('✅ Shape created:', shape);
        
        if (shape) {
          this.addShape(shape, shapeSpec.layer);
          console.log('✅ Shape added to layer:', shapeSpec.layer || 'default');
        } else {
          console.warn('⚠️ Shape creation returned null for:', shapeSpec);
        }
      } catch (error) {
        console.warn('❌ Failed to create shape:', shapeSpec, error);
      }
    }
    
    console.log('🎨 Total shapes created:', this.shapes.length);
  }
  
  /**
   * Create animations from specification
   * @private
   */
  async createAnimationsFromSpec(animationsSpec) {
    for (const animSpec of animationsSpec) {
      try {
        // Find target shape(s)
        const targetShapes = this.findShapesBySelector(animSpec.target);
        
        if (targetShapes.length === 0) {
          console.warn('No shapes found for animation target:', animSpec.target);
          continue;
        }
        
        // Create animation for each target shape
        for (const shape of targetShapes) {
          const animation = this.createAnimationFromSpec(animSpec, shape);
          if (animation) {
            this.addAnimation(animation);
          }
        }
        
      } catch (error) {
        console.warn('Failed to create animation:', animSpec, error);
      }
    }
  }
  
  /**
   * Create single animation from specification
   * @private
   */
  createAnimationFromSpec(spec, targetShape) {
    const animationClass = this.getAnimationClass(spec.type || 'property');
    
    if (!animationClass) {
      console.warn('Unknown animation type:', spec.type);
      return null;
    }
    
    try {
      // Create animation based on type with correct parameters
      let animation;
      
      if (spec.type === 'property' || !spec.type) {
        // PropertyAnimator(property, from, to, options)
        animation = new animationClass(
          spec.property || 'opacity',
          spec.from !== undefined ? spec.from : 0,
          spec.to !== undefined ? spec.to : 1,
          {
            duration: spec.duration || this.timeline.duration,
            delay: spec.delay || 0,
            easing: spec.easing || 'easeInOutQuad'
          }
        );
      } else {
        // Other animators expect (targetShape, options)
        animation = new animationClass(targetShape, {
          ...spec,
          duration: spec.duration || this.timeline.duration
        });
      }
      
      // Store target reference for updates
      animation.target = targetShape;
      
      return animation;
      
    } catch (error) {
      console.warn('Failed to create animation:', spec, error);
      return null;
    }
  }
  
  /**
   * Get animation class by type name
   * @private
   */
  getAnimationClass(type) {
    // Dynamic import would be ideal, but for now we'll use a mapping
    // This should be extended as we add more animation types
    const animationTypes = {
      'property': PropertyAnimator,
      'orbit': OrbitAnimator,
      'path': PathAnimator
    };
    
    return animationTypes[type];
  }
  
  /**
   * Find shapes by CSS-like selector
   * @private
   */
  findShapesBySelector(selector) {
    if (typeof selector === 'string') {
      // Simple selectors: #id, .class, type
      if (selector.startsWith('#')) {
        const id = selector.substring(1);
        return this.shapes.filter(shape => shape.id === id);
      } else if (selector.startsWith('.')) {
        const className = selector.substring(1);
        return this.shapes.filter(shape => 
          shape.properties.className === className ||
          (shape.properties.classes && shape.properties.classes.includes(className))
        );
      } else {
        // Type selector
        return this.shapes.filter(shape => shape.type === selector);
      }
    } else if (Array.isArray(selector)) {
      // Array of selectors
      return selector.flatMap(sel => this.findShapesBySelector(sel));
    } else if (typeof selector === 'object') {
      // Object with properties to match
      return this.shapes.filter(shape => {
        return Object.entries(selector).every(([key, value]) => {
          return shape.properties[key] === value;
        });
      });
    }
    
    return [];
  }
  
  /**
   * Add a shape to the visualization
   * 
   * @param {Shape} shape - Shape to add
   * @param {string} [layer] - Layer name
   */
  addShape(shape, layer = 'default') {
    if (!this.shapes.includes(shape)) {
      this.shapes.push(shape);
      this.renderer.addToLayer(shape, layer);
    }
  }
  
  /**
   * Remove a shape from the visualization
   * 
   * @param {Shape} shape - Shape to remove
   */
  removeShape(shape) {
    const index = this.shapes.indexOf(shape);
    if (index !== -1) {
      this.shapes.splice(index, 1);
      
      // Remove from all layers (renderer will handle this efficiently)
      for (const [layerName] of this.renderer.layers) {
        this.renderer.removeFromLayer(shape, layerName);
      }
      
      // Remove any animations targeting this shape
      this.animations = this.animations.filter(animation => {
        if (animation.target === shape) {
          animation.destroy();
          return false;
        }
        return true;
      });
    }
  }
  
  /**
   * Add an animation to the visualization
   * 
   * @param {Animator} animation - Animation to add
   */
  addAnimation(animation) {
    if (!this.animations.includes(animation)) {
      this.animations.push(animation);
      // AnimationManager expects target and animator, but we'll handle this differently
      // The animation already knows its target, so we'll manage them directly
    }
  }
  
  /**
   * Remove an animation from the visualization
   * 
   * @param {Animator} animation - Animation to remove
   */
  removeAnimation(animation) {
    const index = this.animations.indexOf(animation);
    if (index !== -1) {
      this.animations.splice(index, 1);
      animation.destroy();
    }
  }
  
  /**
   * Start playback
   */
  play() {
    if (!this.isInitialized) return;
    
    this.timeline.play();
  }
  
  /**
   * Pause playback
   */
  pause() {
    if (!this.isInitialized) return;
    
    this.timeline.pause();
  }
  
  /**
   * Stop playback and reset
   */
  stop() {
    if (!this.isInitialized) return;
    
    this.timeline.stop();
    
    // Reset all animations
    this.animationManager.resetAll();
    
    // Render initial state
    this.render();
  }
  
  /**
   * Seek to specific time
   * 
   * @param {number} time - Time in milliseconds
   */
  seek(time) {
    if (!this.isInitialized) return;
    
    this.timeline.seek(time);
    
    // Update animations to current time
    this.animations.forEach(animation => {
      animation.update(time, animation.target);
    });
    
    // Render current state
    this.render();
  }
  
  /**
   * Handle timeline start event
   * @private
   */
  handleTimelineStart() {
    // Reset all animations
    this.animations.forEach(animation => {
      animation.reset();
    });
    
    if (this.onStart) {
      this.onStart(this);
    }
  }
  
  /**
   * Handle timeline complete event
   * @private
   */
  handleTimelineComplete() {
    if (this.onComplete) {
      this.onComplete(this);
    }
  }
  
  /**
   * Handle frame update
   * @private
   */
  handleFrame(currentTime) {
    const frameStart = performance.now();
    
    try {
      // Update all animations
      this.animations.forEach(animation => {
        if (animation.isActive) {
          animation.update(currentTime, animation.target);
        }
      });
      
      // Render frame
      this.render();
      
      // Update performance stats
      const renderTime = performance.now() - frameStart;
      this.updatePerformanceStats(renderTime);
      
      // Trigger frame callback
      if (this.onFrame) {
        this.onFrame(this, currentTime);
      }
      
    } catch (error) {
      console.error('Error during frame update:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }
  
  /**
   * Update performance statistics
   * @private
   */
  updatePerformanceStats(renderTime) {
    this.stats.totalFrames++;
    this.stats.totalRenderTime += renderTime;
    this.stats.averageRenderTime = this.stats.totalRenderTime / this.stats.totalFrames;
    
    // Calculate FPS based on timeline
    const timelineStats = this.timeline.getPerformanceStats();
    this.stats.lastFPS = timelineStats.averageFPS;
  }
  
  /**
   * Render current frame
   */
  render() {
    if (!this.isInitialized) return;
    
    this.renderer.render();
  }
  
  /**
   * Clear all shapes and animations
   */
  clear() {
    // Stop timeline
    this.timeline.stop();
    
    // Clear animations
    this.animations.forEach(animation => animation.destroy());
    this.animations = [];
    
    // Clear shapes
    this.shapes = [];
    for (const [layerName] of this.renderer.layers) {
      this.renderer.clearLayer(layerName);
    }
    
    // Clear canvas
    this.renderer.clear(true);
    
    // Reset stats
    this.stats = {
      totalFrames: 0,
      totalRenderTime: 0,
      lastFPS: 0,
      averageRenderTime: 0
    };
    
    this.currentSpec = null;
  }
  
  /**
   * Resize canvas
   * 
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (!this.isInitialized) return;
    
    this.renderer.resize(width, height);
    this.render();
  }
  
  /**
   * Set viewport (pan/zoom)
   * 
   * @param {number} x - X offset
   * @param {number} y - Y offset
   * @param {number} [scale] - Scale factor
   */
  setViewport(x, y, scale = 1) {
    if (!this.isInitialized) return;
    
    this.renderer.setViewport(x, y, scale);
    this.render();
  }
  
  /**
   * Get current state information
   * 
   * @returns {Object} Complete state object
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      timeline: this.timeline ? this.timeline.getState() : null,
      renderer: this.renderer ? this.renderer.getPerformanceStats() : null,
      shapes: this.shapes.length,
      animations: this.animations.length,
      performance: this.stats,
      currentSpec: this.currentSpec
    };
  }
  
  /**
   * Get performance statistics
   * 
   * @returns {Object} Performance metrics
   */
  getPerformanceStats() {
    return {
      ...this.stats,
      timeline: this.timeline ? this.timeline.getPerformanceStats() : null,
      renderer: this.renderer ? this.renderer.getPerformanceStats() : null,
      memory: {
        shapes: this.shapes.length,
        animations: this.animations.length
      }
    };
  }
  
  /**
   * Export current frame as image
   * 
   * @param {string} [format] - Image format
   * @param {number} [quality] - Image quality
   * @returns {string} Data URL
   */
  exportFrame(format = 'image/png', quality = 0.92) {
    if (!this.isInitialized) return null;
    
    return this.renderer.screenshot(format, quality);
  }
  
  /**
   * Export animation as image sequence (requires manual frame stepping)
   * 
   * @param {Object} options - Export options
   * @returns {Array} Array of data URLs
   */
  exportSequence(options = {}) {
    if (!this.isInitialized) return [];
    
    const {
      startTime = 0,
      endTime = this.timeline.duration,
      frameRate = 30,
      format = 'image/png',
      quality = 0.92
    } = options;
    
    const frames = [];
    const frameInterval = 1000 / frameRate;
    const wasPlaying = this.timeline.isPlaying();
    
    // Pause timeline for manual stepping
    if (wasPlaying) {
      this.timeline.pause();
    }
    
    try {
      for (let time = startTime; time <= endTime; time += frameInterval) {
        this.seek(time);
        frames.push(this.exportFrame(format, quality));
      }
    } finally {
      // Restore original state
      if (wasPlaying) {
        this.timeline.play();
      }
    }
    
    return frames;
  }
  
  /**
   * Cleanup and destroy engine
   */
  destroy() {
    // Stop timeline
    if (this.timeline) {
      this.timeline.destroy();
    }
    
    // Clear all content
    this.clear();
    
    // Destroy systems
    if (this.renderer) {
      this.renderer.destroy();
    }
    
    // Clear animations
    this.animations.forEach(animation => {
      if (animation.destroy) animation.destroy();
    });
    
    // Clear references
    this.timeline = null;
    this.renderer = null;
    this.animationManager = null;
    this.shapes = [];
    this.animations = [];
    this.currentSpec = null;
    
    // Clear callbacks
    this.onReady = null;
    this.onStart = null;
    this.onComplete = null;
    this.onError = null;
    this.onFrame = null;
    
    this.isInitialized = false;
  }
}