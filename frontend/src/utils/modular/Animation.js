/**
 * Base Animator Class - Foundation for all animation types
 * 
 * This abstract class defines the interface that all animators must implement.
 * It handles timing, easing, and the update lifecycle for animations.
 */
export class Animator {
  constructor(options = {}) {
    this.duration = options.duration || 1000;          // Animation duration in milliseconds
    this.delay = options.delay || 0;                   // Delay before animation starts
    this.easing = options.easing || 'easeInOutQuad';   // Easing function name
    this.loop = options.loop || false;                 // Whether to loop animation
    this.yoyo = options.yoyo || false;                 // Whether to reverse on loop
    this.direction = options.direction || 1;           // 1 for forward, -1 for reverse
    
    // Internal state
    this.startTime = 0;                                // When animation started
    this.isActive = false;                             // Whether animation is running
    this.isComplete = false;                           // Whether animation finished
    this.progress = 0;                                 // Raw progress (0-1)
    this.easedProgress = 0;                            // Eased progress (0-1)
    
    // Callbacks
    this.onStart = options.onStart || null;            // Called when animation starts
    this.onUpdate = options.onUpdate || null;          // Called each frame
    this.onComplete = options.onComplete || null;      // Called when animation completes
  }
  
  /**
   * Start the animation at given time
   * 
   * @param {number} currentTime - Current timeline time
   */
  start(currentTime) {
    this.startTime = currentTime + this.delay;
    this.isActive = true;
    this.isComplete = false;
    this.progress = 0;
    this.easedProgress = 0;
    
    if (this.onStart) {
      this.onStart(this);
    }
  }
  
  /**
   * Update animation at given time
   * 
   * @param {number} currentTime - Current timeline time
   * @param {Object} target - Object to animate (Shape instance)
   * @returns {boolean} True if animation is still active
   */
  update(currentTime, target) {
    // Not started yet
    if (currentTime < this.startTime) {
      return true;
    }
    
    // Calculate raw progress
    const elapsed = currentTime - this.startTime;
    this.progress = Math.min(elapsed / this.duration, 1);
    
    // Handle looping
    if (this.progress >= 1 && this.loop) {
      if (this.yoyo) {
        this.direction *= -1; // Reverse direction
      }
      this.startTime = currentTime; // Restart
      this.progress = 0;
    }
    
    // Apply direction (for yoyo effect)
    let directionalProgress = this.direction > 0 ? this.progress : 1 - this.progress;
    
    // Apply easing
    this.easedProgress = this.applyEasing(directionalProgress);
    
    // Update the target object
    this.updateTarget(target, this.easedProgress);
    
    // Check completion
    if (this.progress >= 1 && !this.loop) {
      this.isActive = false;
      this.isComplete = true;
      
      if (this.onComplete) {
        this.onComplete(this);
      }
    }
    
    // Trigger update callback
    if (this.onUpdate) {
      this.onUpdate(this, this.easedProgress);
    }
    
    return this.isActive;
  }
  
  /**
   * Update target object - must be implemented by subclasses
   * 
   * @param {Object} target - Target object to animate
   * @param {number} progress - Eased progress (0-1)
   */
  updateTarget(target, progress) {
    throw new Error('Animator subclass must implement updateTarget() method');
  }
  
  /**
   * Apply easing function to progress
   * 
   * @param {number} t - Raw progress (0-1)
   * @returns {number} Eased progress (0-1)
   */
  applyEasing(t) {
    switch (this.easing) {
      case 'linear':
        return t;
        
      case 'easeInQuad':
        return t * t;
        
      case 'easeOutQuad':
        return t * (2 - t);
        
      case 'easeInOutQuad':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        
      case 'easeInCubic':
        return t * t * t;
        
      case 'easeOutCubic':
        return (--t) * t * t + 1;
        
      case 'easeInOutCubic':
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        
      case 'easeInElastic':
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
        
      case 'easeOutElastic':
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
        
      case 'easeInBounce':
        return 1 - this.applyEasing.call({ easing: 'easeOutBounce' }, 1 - t);
        
      case 'easeOutBounce':
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
        
      default:
        console.warn(`Unknown easing function: ${this.easing}, using linear`);
        return t;
    }
  }
  
  /**
   * Stop the animation
   */
  stop() {
    this.isActive = false;
    this.isComplete = true;
  }
  
  /**
   * Reset animation to initial state
   */
  reset() {
    this.isActive = false;
    this.isComplete = false;
    this.progress = 0;
    this.easedProgress = 0;
    this.startTime = 0;
    this.direction = 1;
  }
  
  /**
   * Clone this animator with same settings
   * 
   * @returns {Animator} New animator instance
   */
  clone() {
    const CloneClass = this.constructor;
    return new CloneClass({
      duration: this.duration,
      delay: this.delay,
      easing: this.easing,
      loop: this.loop,
      yoyo: this.yoyo,
      onStart: this.onStart,
      onUpdate: this.onUpdate,
      onComplete: this.onComplete
    });
  }
}

/**
 * Property Animator - Animates individual properties between values
 * 
 * This animator interpolates between a start and end value for a specific property.
 * It can animate any numeric property like x, y, opacity, radius, etc.
 */
export class PropertyAnimator extends Animator {
  constructor(property, from, to, options = {}) {
    super(options);
    
    this.property = property;                          // Property name to animate
    this.from = from;                                  // Starting value
    this.to = to;                                      // Ending value
    this.initialValue = null;                          // Store original value for restoration
  }
  
  /**
   * Update target property with interpolated value
   */
  updateTarget(target, progress) {
    // Store initial value on first update
    if (this.initialValue === null && target.getCurrentProperties) {
      this.initialValue = target.getCurrentProperties()[this.property];
    }
    
    // Calculate interpolated value
    const value = this.from + (this.to - this.from) * progress;
    
    // Update target property
    if (target.setAnimatedProperty) {
      target.setAnimatedProperty(this.property, value);
    } else {
      target[this.property] = value;
    }
  }
  
  /**
   * Create property animator from JSON specification
   */
  static fromSpec(spec) {
    return new PropertyAnimator(
      spec.property,
      spec.from,
      spec.to,
      {
        duration: spec.duration || 1000,
        delay: spec.delay || 0,
        easing: spec.easing || 'easeInOutQuad'
      }
    );
  }
}

/**
 * Orbit Animator - Animates circular motion around a center point
 * 
 * This animator moves an object in a circular path around a center point.
 * It's commonly used for planetary motion, rotating elements, etc.
 */
export class OrbitAnimator extends Animator {
  constructor(centerX, centerY, radius, options = {}) {
    super({ loop: true, ...options }); // Orbits typically loop by default
    
    this.centerX = centerX;                            // Orbit center X
    this.centerY = centerY;                            // Orbit center Y
    this.radius = radius;                              // Orbit radius
    this.startAngle = options.startAngle || 0;         // Starting angle (radians)
    this.clockwise = options.clockwise !== false;      // Direction (default clockwise)
  }
  
  /**
   * Update target position along orbital path
   */
  updateTarget(target, progress) {
    // Calculate current angle (full rotation = 2π radians)
    let angle = this.startAngle + (progress * Math.PI * 2);
    
    // Reverse direction if counter-clockwise
    if (!this.clockwise) {
      angle = this.startAngle - (progress * Math.PI * 2);
    }
    
    // Calculate position on orbit
    const x = this.centerX + this.radius * Math.cos(angle);
    const y = this.centerY + this.radius * Math.sin(angle);
    
    // Update target position
    if (target.setAnimatedProperty) {
      target.setAnimatedProperty('x', x);
      target.setAnimatedProperty('y', y);
    } else {
      target.x = x;
      target.y = y;
    }
  }
  
  /**
   * Create orbit animator from JSON specification
   */
  static fromSpec(spec) {
    return new OrbitAnimator(
      spec.centerX || 0,
      spec.centerY || 0,
      spec.radius || 100,
      {
        duration: spec.duration || 2000,
        delay: spec.delay || 0,
        easing: spec.easing || 'linear',
        startAngle: spec.startAngle || 0,
        clockwise: spec.clockwise !== false
      }
    );
  }
}

/**
 * Path Animator - Animates movement along a complex path
 * 
 * This animator moves an object along a predefined path made up of multiple points.
 * It supports both linear and curved paths with smooth interpolation.
 */
export class PathAnimator extends Animator {
  constructor(points, options = {}) {
    super(options);
    
    this.points = points || [];                        // Array of {x, y} points
    this.smooth = options.smooth || false;             // Whether to smooth path
    this.totalLength = this.calculatePathLength();     // Total path length for timing
  }
  
  /**
   * Calculate total path length for proper timing
   */
  calculatePathLength() {
    let length = 0;
    for (let i = 1; i < this.points.length; i++) {
      const p1 = this.points[i - 1];
      const p2 = this.points[i];
      length += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    return length;
  }
  
  /**
   * Get position along path at given progress
   */
  getPositionAtProgress(progress) {
    if (this.points.length < 2) return this.points[0] || { x: 0, y: 0 };
    
    const targetDistance = progress * this.totalLength;
    let currentDistance = 0;
    
    for (let i = 1; i < this.points.length; i++) {
      const p1 = this.points[i - 1];
      const p2 = this.points[i];
      const segmentLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      
      if (currentDistance + segmentLength >= targetDistance) {
        // Found the segment, interpolate within it
        const segmentProgress = (targetDistance - currentDistance) / segmentLength;
        return {
          x: p1.x + (p2.x - p1.x) * segmentProgress,
          y: p1.y + (p2.y - p1.y) * segmentProgress
        };
      }
      
      currentDistance += segmentLength;
    }
    
    // Return last point if we've gone beyond the path
    return this.points[this.points.length - 1];
  }
  
  /**
   * Update target position along path
   */
  updateTarget(target, progress) {
    const position = this.getPositionAtProgress(progress);
    
    // Update target position
    if (target.setAnimatedProperty) {
      target.setAnimatedProperty('x', position.x);
      target.setAnimatedProperty('y', position.y);
    } else {
      target.x = position.x;
      target.y = position.y;
    }
  }
  
  /**
   * Create path animator from JSON specification
   */
  static fromSpec(spec) {
    return new PathAnimator(
      spec.points || [],
      {
        duration: spec.duration || 2000,
        delay: spec.delay || 0,
        easing: spec.easing || 'easeInOutQuad',
        smooth: spec.smooth || false
      }
    );
  }
}

/**
 * Animation Manager - Orchestrates multiple animators
 * 
 * This class manages multiple animators running on different objects,
 * handles timing coordination, and provides batch operations.
 */
export class AnimationManager {
  constructor() {
    this.animators = new Map();                        // Map of target -> animators[]
    this.activeAnimators = new Set();                  // Set of currently active animators
    this.globalTime = 0;                               // Current global time
  }
  
  /**
   * Add animator for a target object
   * 
   * @param {Object} target - Target object to animate
   * @param {Animator} animator - Animator instance
   */
  addAnimator(target, animator) {
    if (!this.animators.has(target)) {
      this.animators.set(target, []);
    }
    
    this.animators.get(target).push(animator);
    this.activeAnimators.add(animator);
  }
  
  /**
   * Remove all animators for a target
   * 
   * @param {Object} target - Target object
   */
  removeAnimators(target) {
    const animators = this.animators.get(target) || [];
    animators.forEach(animator => {
      animator.stop();
      this.activeAnimators.delete(animator);
    });
    this.animators.delete(target);
  }
  
  /**
   * Update all active animations
   * 
   * @param {number} currentTime - Current timeline time
   */
  update(currentTime) {
    this.globalTime = currentTime;
    
    // Update each target's animators
    for (const [target, animators] of this.animators) {
      const activeCount = animators.filter(animator => {
        const stillActive = animator.update(currentTime, target);
        if (!stillActive) {
          this.activeAnimators.delete(animator);
        }
        return stillActive;
      }).length;
      
      // Remove target if no active animators
      if (activeCount === 0) {
        this.animators.delete(target);
      }
    }
  }
  
  /**
   * Start all animations
   * 
   * @param {number} currentTime - Current timeline time
   */
  start(currentTime) {
    for (const animator of this.activeAnimators) {
      if (!animator.isActive) {
        animator.start(currentTime);
      }
    }
  }
  
  /**
   * Stop all animations
   */
  stop() {
    for (const animator of this.activeAnimators) {
      animator.stop();
    }
    this.activeAnimators.clear();
  }
  
  /**
   * Reset all animations
   */
  reset() {
    for (const animator of this.activeAnimators) {
      animator.reset();
    }
  }
  
  /**
   * Get number of active animations
   */
  getActiveCount() {
    return this.activeAnimators.size;
  }
  
  /**
   * Check if any animations are running
   */
  hasActiveAnimations() {
    return this.activeAnimators.size > 0;
  }
}