/**
 * Timeline Class - Manages playback state and timing
 * 
 * This class handles the overall timeline control for visualizations,
 * including play/pause state, looping, FPS control, and time management.
 * It acts as the central coordinator for all animation timing.
 */
export class Timeline {
  constructor(options = {}) {
    // Timeline configuration
    this.duration = options.duration || 5000;         // Total timeline duration in ms
    this.fps = options.fps || 60;                     // Target frames per second
    this.loop = options.loop || false;                // Whether to loop at end
    this.autoPlay = options.autoPlay || false;        // Start playing immediately
    
    // Timing state
    this.currentTime = 0;                             // Current position in timeline (ms)
    this.startTime = 0;                               // When timeline started (performance.now)
    this.pausedTime = 0;                              // Time spent paused
    this.lastFrameTime = 0;                           // Last frame timestamp
    
    // Playback state
    this.state = 'stopped';                           // stopped, playing, paused, completed
    this.playbackRate = 1;                            // Playback speed multiplier
    this.frameInterval = 1000 / this.fps;             // MS between frames
    this.animationFrame = null;                       // RequestAnimationFrame ID
    
    // Callbacks
    this.onStart = options.onStart || null;           // Called when playback starts
    this.onPause = options.onPause || null;           // Called when paused
    this.onResume = options.onResume || null;         // Called when resumed
    this.onComplete = options.onComplete || null;     // Called when completed
    this.onLoop = options.onLoop || null;             // Called on loop restart
    this.onUpdate = options.onUpdate || null;         // Called each frame
    this.onTimeChange = options.onTimeChange || null; // Called when time changes
    
    // Performance tracking
    this.frameCount = 0;                              // Total frames rendered
    this.droppedFrames = 0;                           // Frames skipped due to performance
    this.averageFPS = 0;                              // Actual FPS (performance metric)
    this.fpsHistory = [];                             // Recent FPS samples
    
    // Auto-start if requested
    if (this.autoPlay) {
      this.play();
    }
  }
  
  /**
   * Start or resume playback
   * 
   * @param {number} [fromTime] - Optional time to start from
   */
  play(fromTime = null) {
    const now = performance.now();
    
    if (this.state === 'stopped' || this.state === 'completed') {
      // Starting fresh
      this.currentTime = fromTime !== null ? fromTime : 0;
      this.startTime = now - this.currentTime;
      this.pausedTime = 0;
      this.frameCount = 0;
      this.droppedFrames = 0;
      
      if (this.onStart) {
        this.onStart(this);
      }
      
    } else if (this.state === 'paused') {
      // Resuming from pause
      this.pausedTime += now - this.lastFrameTime;
      this.startTime = now - this.currentTime;
      
      if (this.onResume) {
        this.onResume(this);
      }
    }
    
    this.state = 'playing';
    this.lastFrameTime = now;
    this.scheduleNextFrame();
  }
  
  /**
   * Pause playback (can be resumed)
   */
  pause() {
    if (this.state !== 'playing') return;
    
    this.state = 'paused';
    this.lastFrameTime = performance.now();
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    if (this.onPause) {
      this.onPause(this);
    }
  }
  
  /**
   * Stop playback and reset to beginning
   */
  stop() {
    const wasPlaying = this.state === 'playing';
    
    this.state = 'stopped';
    this.currentTime = 0;
    this.startTime = 0;
    this.pausedTime = 0;
    this.frameCount = 0;
    this.droppedFrames = 0;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    if (wasPlaying && this.onTimeChange) {
      this.onTimeChange(this, this.currentTime);
    }
  }
  
  /**
   * Seek to specific time position
   * 
   * @param {number} time - Time position in milliseconds
   */
  seek(time) {
    const clampedTime = Math.max(0, Math.min(time, this.duration));
    const oldTime = this.currentTime;
    
    this.currentTime = clampedTime;
    
    // Update start time if playing
    if (this.state === 'playing') {
      this.startTime = performance.now() - this.currentTime;
    }
    
    // Trigger update if time actually changed
    if (oldTime !== this.currentTime) {
      if (this.onTimeChange) {
        this.onTimeChange(this, this.currentTime);
      }
      
      // Force frame update even if paused
      if (this.onUpdate) {
        this.onUpdate(this, this.currentTime);
      }
    }
  }
  
  /**
   * Set playback rate (speed multiplier)
   * 
   * @param {number} rate - Playback rate (1.0 = normal, 0.5 = half speed, 2.0 = double speed)
   */
  setPlaybackRate(rate) {
    if (rate <= 0) {
      console.warn('Playback rate must be positive');
      return;
    }
    
    // Adjust start time to maintain current position
    if (this.state === 'playing') {
      const now = performance.now();
      this.currentTime = (now - this.startTime) * this.playbackRate;
      this.startTime = now - (this.currentTime / rate);
    }
    
    this.playbackRate = rate;
  }
  
  /**
   * Set timeline duration
   * 
   * @param {number} duration - New duration in milliseconds
   */
  setDuration(duration) {
    this.duration = Math.max(0, duration);
    
    // Clamp current time if beyond new duration
    if (this.currentTime > this.duration) {
      this.seek(this.duration);
    }
  }
  
  /**
   * Set target FPS
   * 
   * @param {number} fps - Target frames per second
   */
  setFPS(fps) {
    this.fps = Math.max(1, Math.min(fps, 120)); // Reasonable FPS range
    this.frameInterval = 1000 / this.fps;
  }
  
  /**
   * Enable or disable looping
   * 
   * @param {boolean} enabled - Whether to loop
   */
  setLoop(enabled) {
    this.loop = enabled;
  }
  
  /**
   * Schedule next animation frame
   * @private
   */
  scheduleNextFrame() {
    if (this.state !== 'playing') return;
    
    this.animationFrame = requestAnimationFrame((timestamp) => {
      this.updateFrame(timestamp);
    });
  }
  
  /**
   * Update timeline for current frame
   * @private
   */
  updateFrame(timestamp) {
    if (this.state !== 'playing') return;
    
    // Calculate current time based on actual elapsed time
    const elapsed = (timestamp - this.startTime) * this.playbackRate;
    this.currentTime = elapsed;
    
    // Check for completion
    if (this.currentTime >= this.duration) {
      if (this.loop) {
        // Loop back to beginning
        this.currentTime = 0;
        this.startTime = timestamp;
        
        if (this.onLoop) {
          this.onLoop(this);
        }
      } else {
        // Complete timeline
        this.currentTime = this.duration;
        this.state = 'completed';
        
        if (this.onComplete) {
          this.onComplete(this);
        }
        
        return; // Don't schedule next frame
      }
    }
    
    // Update performance metrics
    this.updatePerformanceMetrics(timestamp);
    
    // Trigger frame update
    if (this.onUpdate) {
      this.onUpdate(this, this.currentTime);
    }
    
    // Trigger time change if significant
    if (this.onTimeChange) {
      this.onTimeChange(this, this.currentTime);
    }
    
    // Schedule next frame
    this.scheduleNextFrame();
  }
  
  /**
   * Update performance metrics
   * @private
   */
  updatePerformanceMetrics(timestamp) {
    this.frameCount++;
    
    // Calculate FPS
    if (this.lastFrameTime > 0) {
      const frameDelta = timestamp - this.lastFrameTime;
      const currentFPS = 1000 / frameDelta;
      
      // Keep rolling average of recent FPS
      this.fpsHistory.push(currentFPS);
      if (this.fpsHistory.length > 60) { // Keep last 60 frames
        this.fpsHistory.shift();
      }
      
      this.averageFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
      
      // Count dropped frames (frames taking too long)
      if (frameDelta > this.frameInterval * 1.5) {
        this.droppedFrames++;
      }
    }
    
    this.lastFrameTime = timestamp;
  }
  
  /**
   * Get current progress as percentage (0-1)
   * 
   * @returns {number} Progress from 0 to 1
   */
  getProgress() {
    return this.duration > 0 ? Math.min(this.currentTime / this.duration, 1) : 0;
  }
  
  /**
   * Get remaining time in milliseconds
   * 
   * @returns {number} Remaining time
   */
  getRemainingTime() {
    return Math.max(0, this.duration - this.currentTime);
  }
  
  /**
   * Get current state information
   * 
   * @returns {Object} State object with all current values
   */
  getState() {
    return {
      state: this.state,
      currentTime: this.currentTime,
      duration: this.duration,
      progress: this.getProgress(),
      remainingTime: this.getRemainingTime(),
      playbackRate: this.playbackRate,
      loop: this.loop,
      fps: this.fps,
      averageFPS: this.averageFPS,
      frameCount: this.frameCount,
      droppedFrames: this.droppedFrames
    };
  }
  
  /**
   * Get performance statistics
   * 
   * @returns {Object} Performance metrics
   */
  getPerformanceStats() {
    return {
      targetFPS: this.fps,
      averageFPS: Math.round(this.averageFPS * 100) / 100,
      frameCount: this.frameCount,
      droppedFrames: this.droppedFrames,
      dropRate: this.frameCount > 0 ? (this.droppedFrames / this.frameCount) * 100 : 0,
      efficiency: this.fps > 0 ? Math.min((this.averageFPS / this.fps) * 100, 100) : 0
    };
  }
  
  /**
   * Check if timeline is currently playing
   * 
   * @returns {boolean} True if playing
   */
  isPlaying() {
    return this.state === 'playing';
  }
  
  /**
   * Check if timeline is paused
   * 
   * @returns {boolean} True if paused
   */
  isPaused() {
    return this.state === 'paused';
  }
  
  /**
   * Check if timeline is completed
   * 
   * @returns {boolean} True if completed
   */
  isCompleted() {
    return this.state === 'completed';
  }
  
  /**
   * Check if timeline is stopped
   * 
   * @returns {boolean} True if stopped
   */
  isStopped() {
    return this.state === 'stopped';
  }
  
  /**
   * Cleanup resources
   */
  destroy() {
    this.stop();
    
    // Clear all callbacks to prevent memory leaks
    this.onStart = null;
    this.onPause = null;
    this.onResume = null;
    this.onComplete = null;
    this.onLoop = null;
    this.onUpdate = null;
    this.onTimeChange = null;
    
    // Clear performance history
    this.fpsHistory = [];
  }
  
  /**
   * Create timeline from JSON specification
   * 
   * @param {Object} spec - Timeline specification
   * @returns {Timeline} New timeline instance
   */
  static fromSpec(spec) {
    return new Timeline({
      duration: spec.duration || 5000,
      fps: spec.fps || 60,
      loop: spec.loop || false,
      autoPlay: spec.autoPlay || false
    });
  }
}