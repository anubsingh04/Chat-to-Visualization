/**
 * Modular Visualization System - Main Export
 * 
 * This is the main entry point for the modular visualization system.
 * Import from this file to get access to all components.
 */

// Main engine
export { ModularVisualizationEngine } from './ModularVisualizationEngine.js';

// Core systems
export { Shape, ShapeRegistry } from './Shape.js';
export { Timeline } from './Timeline.js';
export { Renderer } from './Renderer.js';
export { Animator, PropertyAnimator, OrbitAnimator, PathAnimator, AnimationManager } from './Animation.js';

// Shape implementations
export { Circle, Arrow, Text, Line } from './shapes/index.js';

// Examples and utilities
export { default as examples } from './examples.js';

/**
 * Quick start function for simple usage
 * 
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} spec - Visualization specification
 * @param {Object} options - Engine options
 * @returns {Promise<ModularVisualizationEngine>} Engine instance
 */
export async function createVisualization(canvas, spec, options = {}) {
  const { ModularVisualizationEngine } = await import('./ModularVisualizationEngine.js');
  
  const engine = new ModularVisualizationEngine(canvas, {
    autoPlay: true,
    ...options
  });
  
  await engine.loadFromSpec(spec);
  return engine;
}

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Feature capabilities
 */
export const FEATURES = {
  shapes: ['circle', 'arrow', 'text', 'line'],
  animations: ['property', 'orbit', 'path'],
  easing: [
    'linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
    'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
    'easeInSine', 'easeOutSine', 'easeInOutSine',
    'easeInElastic', 'easeOutElastic', 'easeInOutElastic'
  ],
  optimization: {
    viewportCulling: true,
    dirtyRegions: true,
    layerManagement: true,
    performanceMonitoring: true
  }
};