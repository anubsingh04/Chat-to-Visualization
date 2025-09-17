/**
 * Integration Examples and Documentation
 * 
 * This file demonstrates how to use the new ModularVisualizationEngine
 * with JSON specifications and provides integration patterns.
 */

import { ModularVisualizationEngine } from './ModularVisualizationEngine.js';

/**
 * Example 1: Basic Usage with Simple Animation
 */
export const basicExample = {
  async setup(canvas) {
    // Create engine instance
    const engine = new ModularVisualizationEngine(canvas, {
      fps: 60,
      duration: 3000,
      loop: true,
      autoPlay: true,
      onReady: () => console.log('Visualization ready'),
      onStart: () => console.log('Animation started'),
      onComplete: () => console.log('Animation completed')
    });
    
    // Define visualization specification
    const spec = {
      duration: 3000,
      fps: 60,
      loop: true,
      autoPlay: true,
      shapes: [
        {
          id: 'circle1',
          type: 'circle',
          properties: {
            center: { x: 200, y: 200 },
            radius: 50,
            fill: '#3498db',
            opacity: 1
          },
          layer: 'default'
        }
      ],
      animations: [
        {
          target: '#circle1',
          type: 'property',
          property: 'center.x',
          from: 100,
          to: 400,
          duration: 3000,
          easing: 'easeInOutQuad',
          yoyo: true
        }
      ]
    };
    
    // Load and start visualization
    await engine.loadFromSpec(spec);
    
    return engine;
  }
};

/**
 * Example 2: Complex Multi-Shape Animation
 */
export const complexExample = {
  async setup(canvas) {
    const engine = new ModularVisualizationEngine(canvas, {
      fps: 60,
      duration: 5000,
      loop: true,
      backgroundColor: '#f8f9fa'
    });
    
    const spec = {
      duration: 5000,
      fps: 60,
      loop: true,
      shapes: [
        {
          id: 'title',
          type: 'text',
          properties: {
            position: { x: 400, y: 50 },
            text: 'Modular Animation Demo',
            font: '24px Arial',
            fill: '#2c3e50',
            align: 'center'
          },
          layer: 'ui'
        },
        {
          id: 'orbit-center',
          type: 'circle',
          properties: {
            center: { x: 400, y: 300 },
            radius: 8,
            fill: '#e74c3c',
            opacity: 0.8
          },
          layer: 'background'
        },
        {
          id: 'orbiting-circle',
          type: 'circle',
          properties: {
            center: { x: 500, y: 300 },
            radius: 20,
            fill: '#3498db',
            opacity: 0.9
          },
          layer: 'default'
        },
        {
          id: 'arrow1',
          type: 'arrow',
          properties: {
            start: { x: 100, y: 400 },
            direction: { x: 1, y: 0 },
            length: 100,
            color: '#27ae60',
            thickness: 3
          },
          layer: 'default'
        },
        {
          id: 'line1',
          type: 'line',
          properties: {
            start: { x: 50, y: 500 },
            end: { x: 200, y: 500 },
            stroke: '#9b59b6',
            lineWidth: 2,
            opacity: 0.7
          },
          layer: 'background'
        }
      ],
      animations: [
        {
          target: '#orbiting-circle',
          type: 'orbit',
          center: { x: 400, y: 300 },
          radius: 100,
          duration: 4000,
          direction: 'clockwise',
          easing: 'linear'
        },
        {
          target: '#arrow1',
          type: 'property',
          property: 'start.x',
          from: 100,
          to: 600,
          duration: 3000,
          easing: 'easeInOutCubic',
          yoyo: true
        },
        {
          target: '#arrow1',
          type: 'property',
          property: 'direction.y',
          from: 0,
          to: 0.5,
          duration: 1500,
          easing: 'easeInOutSine',
          yoyo: true,
          delay: 500
        },
        {
          target: '#line1',
          type: 'property',
          property: 'end.x',
          from: 200,
          to: 750,
          duration: 2500,
          easing: 'easeOutBounce',
          delay: 1000
        },
        {
          target: '#title',
          type: 'property',
          property: 'opacity',
          from: 1,
          to: 0.3,
          duration: 1000,
          easing: 'easeInOutQuad',
          yoyo: true,
          delay: 2000
        }
      ]
    };
    
    await engine.loadFromSpec(spec);
    return engine;
  }
};

/**
 * Example 3: Path Animation with Custom Shapes
 */
export const pathExample = {
  async setup(canvas) {
    const engine = new ModularVisualizationEngine(canvas, {
      fps: 60,
      duration: 6000,
      loop: true
    });
    
    // Define a complex path
    const heartPath = [
      { x: 400, y: 300 },
      { x: 380, y: 280 },
      { x: 360, y: 260 },
      { x: 340, y: 240 },
      { x: 320, y: 220 },
      { x: 300, y: 240 },
      { x: 320, y: 260 },
      { x: 340, y: 280 },
      { x: 360, y: 300 },
      { x: 380, y: 320 },
      { x: 400, y: 340 },
      { x: 420, y: 320 },
      { x: 440, y: 300 },
      { x: 460, y: 280 },
      { x: 480, y: 260 },
      { x: 500, y: 240 },
      { x: 480, y: 220 },
      { x: 460, y: 240 },
      { x: 440, y: 260 },
      { x: 420, y: 280 },
      { x: 400, y: 300 }
    ];
    
    const spec = {
      duration: 6000,
      fps: 60,
      loop: true,
      shapes: [
        {
          id: 'path-follower',
          type: 'circle',
          properties: {
            center: { x: 400, y: 300 },
            radius: 15,
            fill: '#e74c3c',
            opacity: 1
          },
          layer: 'default'
        },
        {
          id: 'trail1',
          type: 'circle',
          properties: {
            center: { x: 400, y: 300 },
            radius: 8,
            fill: '#f39c12',
            opacity: 0.6
          },
          layer: 'trail'
        },
        {
          id: 'trail2',
          type: 'circle',
          properties: {
            center: { x: 400, y: 300 },
            radius: 5,
            fill: '#f1c40f',
            opacity: 0.4
          },
          layer: 'trail'
        }
      ],
      animations: [
        {
          target: '#path-follower',
          type: 'path',
          path: heartPath,
          duration: 6000,
          easing: 'linear'
        },
        {
          target: '#trail1',
          type: 'path',
          path: heartPath,
          duration: 6000,
          easing: 'linear',
          delay: 100
        },
        {
          target: '#trail2',
          type: 'path',
          path: heartPath,
          duration: 6000,
          easing: 'linear',
          delay: 200
        }
      ]
    };
    
    await engine.loadFromSpec(spec);
    return engine;
  }
};

/**
 * Example 4: Interactive Controls Integration
 */
export const interactiveExample = {
  async setup(canvas, controlsContainer) {
    const engine = new ModularVisualizationEngine(canvas, {
      fps: 60,
      duration: 4000,
      loop: false,
      autoPlay: false
    });
    
    // Create control buttons
    const controls = this.createControls(controlsContainer, engine);
    
    const spec = {
      duration: 4000,
      fps: 60,
      loop: false,
      shapes: [
        {
          id: 'bouncing-ball',
          type: 'circle',
          properties: {
            center: { x: 100, y: 100 },
            radius: 30,
            fill: '#3498db',
            opacity: 1
          }
        }
      ],
      animations: [
        {
          target: '#bouncing-ball',
          type: 'property',
          property: 'center.y',
          from: 100,
          to: 400,
          duration: 1000,
          easing: 'easeOutBounce'
        },
        {
          target: '#bouncing-ball',
          type: 'property',
          property: 'center.x',
          from: 100,
          to: 700,
          duration: 4000,
          easing: 'linear'
        }
      ]
    };
    
    await engine.loadFromSpec(spec);
    
    return { engine, controls };
  },
  
  createControls(container, engine) {
    const controlsHTML = `
      <div style="padding: 10px; background: #f8f9fa; border-radius: 5px; margin-top: 10px;">
        <button id="play-btn">Play</button>
        <button id="pause-btn">Pause</button>
        <button id="stop-btn">Stop</button>
        <input type="range" id="seek-slider" min="0" max="4000" value="0" style="width: 200px; margin: 0 10px;">
        <span id="time-display">0 / 4000ms</span>
        <br><br>
        <label>Speed: </label>
        <input type="range" id="speed-slider" min="0.1" max="3" step="0.1" value="1" style="width: 150px;">
        <span id="speed-display">1x</span>
      </div>
    `;
    
    container.innerHTML = controlsHTML;
    
    // Bind events
    document.getElementById('play-btn').onclick = () => engine.play();
    document.getElementById('pause-btn').onclick = () => engine.pause();
    document.getElementById('stop-btn').onclick = () => engine.stop();
    
    const seekSlider = document.getElementById('seek-slider');
    const timeDisplay = document.getElementById('time-display');
    const speedSlider = document.getElementById('speed-slider');
    const speedDisplay = document.getElementById('speed-display');
    
    seekSlider.oninput = (e) => {
      engine.seek(parseInt(e.target.value));
    };
    
    speedSlider.oninput = (e) => {
      const speed = parseFloat(e.target.value);
      engine.timeline.setPlaybackRate(speed);
      speedDisplay.textContent = `${speed}x`;
    };
    
    // Update time display
    engine.timeline.onTimeChange = (timeline, currentTime) => {
      seekSlider.value = currentTime;
      timeDisplay.textContent = `${Math.round(currentTime)} / ${timeline.duration}ms`;
    };
    
    return {
      seekSlider,
      timeDisplay,
      speedSlider,
      speedDisplay
    };
  }
};

/**
 * Example 5: Performance Monitoring
 */
export const performanceExample = {
  async setup(canvas, statsContainer) {
    const engine = new ModularVisualizationEngine(canvas, {
      fps: 60,
      duration: 3000,
      loop: true,
      autoPlay: true,
      debugMode: true
    });
    
    // Create performance monitor
    const monitor = this.createPerformanceMonitor(statsContainer, engine);
    
    // Stress test with many shapes
    const shapes = [];
    const animations = [];
    
    for (let i = 0; i < 50; i++) {
      const id = `circle${i}`;
      shapes.push({
        id,
        type: 'circle',
        properties: {
          center: { x: Math.random() * 800, y: Math.random() * 600 },
          radius: Math.random() * 20 + 10,
          fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
          opacity: Math.random() * 0.5 + 0.5
        }
      });
      
      animations.push({
        target: `#${id}`,
        type: 'property',
        property: 'center.x',
        from: Math.random() * 800,
        to: Math.random() * 800,
        duration: Math.random() * 2000 + 1000,
        easing: 'easeInOutSine',
        yoyo: true,
        delay: Math.random() * 1000
      });
    }
    
    const spec = {
      duration: 3000,
      fps: 60,
      loop: true,
      shapes,
      animations
    };
    
    await engine.loadFromSpec(spec);
    
    return { engine, monitor };
  },
  
  createPerformanceMonitor(container, engine) {
    const monitorHTML = `
      <div style="padding: 10px; background: #2c3e50; color: white; border-radius: 5px; font-family: monospace; margin-top: 10px;">
        <div id="fps-display">FPS: --</div>
        <div id="render-time-display">Render Time: --ms</div>
        <div id="shapes-display">Shapes: --</div>
        <div id="animations-display">Animations: --</div>
        <div id="memory-display">Memory: --</div>
      </div>
    `;
    
    container.innerHTML = monitorHTML;
    
    const fpsDisplay = document.getElementById('fps-display');
    const renderTimeDisplay = document.getElementById('render-time-display');
    const shapesDisplay = document.getElementById('shapes-display');
    const animationsDisplay = document.getElementById('animations-display');
    const memoryDisplay = document.getElementById('memory-display');
    
    // Update stats every 100ms
    const updateInterval = setInterval(() => {
      const stats = engine.getPerformanceStats();
      
      fpsDisplay.textContent = `FPS: ${Math.round(stats.lastFPS)}`;
      renderTimeDisplay.textContent = `Render Time: ${stats.averageRenderTime.toFixed(2)}ms`;
      shapesDisplay.textContent = `Shapes: ${stats.memory.shapes}`;
      animationsDisplay.textContent = `Animations: ${stats.memory.animations}`;
      
      if (stats.renderer) {
        memoryDisplay.textContent = `Culled: ${stats.renderer.culledObjects}`;
      }
    }, 100);
    
    return {
      updateInterval,
      cleanup: () => clearInterval(updateInterval)
    };
  }
};

/**
 * Example JSON Specifications for AI Integration
 */
export const aiIntegrationExamples = {
  /**
   * Simple data visualization - bar chart animation
   */
  barChart: {
    duration: 3000,
    fps: 60,
    loop: false,
    autoPlay: true,
    shapes: [
      {
        id: 'bar1',
        type: 'line',
        properties: {
          start: { x: 100, y: 400 },
          end: { x: 100, y: 400 },
          stroke: '#3498db',
          lineWidth: 20,
          opacity: 1
        }
      },
      {
        id: 'bar2',
        type: 'line',
        properties: {
          start: { x: 200, y: 400 },
          end: { x: 200, y: 400 },
          stroke: '#e74c3c',
          lineWidth: 20,
          opacity: 1
        }
      },
      {
        id: 'bar3',
        type: 'line',
        properties: {
          start: { x: 300, y: 400 },
          end: { x: 300, y: 400 },
          stroke: '#2ecc71',
          lineWidth: 20,
          opacity: 1
        }
      }
    ],
    animations: [
      {
        target: '#bar1',
        type: 'property',
        property: 'start.y',
        from: 400,
        to: 200,
        duration: 1000,
        easing: 'easeOutBounce',
        delay: 200
      },
      {
        target: '#bar2',
        type: 'property',
        property: 'start.y',
        from: 400,
        to: 150,
        duration: 1000,
        easing: 'easeOutBounce',
        delay: 400
      },
      {
        target: '#bar3',
        type: 'property',
        property: 'start.y',
        from: 400,
        to: 100,
        duration: 1000,
        easing: 'easeOutBounce',
        delay: 600
      }
    ]
  },
  
  /**
   * Process flow visualization
   */
  processFlow: {
    duration: 4000,
    fps: 60,
    loop: true,
    autoPlay: true,
    shapes: [
      {
        id: 'step1',
        type: 'circle',
        properties: {
          center: { x: 100, y: 200 },
          radius: 30,
          fill: '#3498db',
          opacity: 0.3
        }
      },
      {
        id: 'step2',
        type: 'circle',
        properties: {
          center: { x: 300, y: 200 },
          radius: 30,
          fill: '#3498db',
          opacity: 0.3
        }
      },
      {
        id: 'step3',
        type: 'circle',
        properties: {
          center: { x: 500, y: 200 },
          radius: 30,
          fill: '#3498db',
          opacity: 0.3
        }
      },
      {
        id: 'arrow1',
        type: 'arrow',
        properties: {
          start: { x: 130, y: 200 },
          direction: { x: 1, y: 0 },
          length: 140,
          color: '#95a5a6',
          thickness: 2,
          opacity: 0.5
        }
      },
      {
        id: 'arrow2',
        type: 'arrow',
        properties: {
          start: { x: 330, y: 200 },
          direction: { x: 1, y: 0 },
          length: 140,
          color: '#95a5a6',
          thickness: 2,
          opacity: 0.5
        }
      }
    ],
    animations: [
      {
        target: '#step1',
        type: 'property',
        property: 'opacity',
        from: 0.3,
        to: 1,
        duration: 500,
        easing: 'easeInOut',
        delay: 0
      },
      {
        target: '#step2',
        type: 'property',
        property: 'opacity',
        from: 0.3,
        to: 1,
        duration: 500,
        easing: 'easeInOut',
        delay: 1000
      },
      {
        target: '#step3',
        type: 'property',
        property: 'opacity',
        from: 0.3,
        to: 1,
        duration: 500,
        easing: 'easeInOut',
        delay: 2000
      },
      {
        target: '#arrow1',
        type: 'property',
        property: 'opacity',
        from: 0.5,
        to: 1,
        duration: 300,
        easing: 'easeInOut',
        delay: 700
      },
      {
        target: '#arrow2',
        type: 'property',
        property: 'opacity',
        from: 0.5,
        to: 1,
        duration: 300,
        easing: 'easeInOut',
        delay: 1700
      }
    ]
  }
};

/**
 * Utility functions for common integration patterns
 */
export const integrationUtils = {
  /**
   * Create a simple React component wrapper
   */
  createReactWrapper: () => {
    return `
import React, { useEffect, useRef, useState } from 'react';
import { ModularVisualizationEngine } from './utils/modular/ModularVisualizationEngine.js';

export const ModularVisualization = ({ spec, onReady, onComplete, className, style }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeVisualization = async () => {
      try {
        if (!canvasRef.current || !spec) return;

        // Clean up previous engine
        if (engineRef.current) {
          engineRef.current.destroy();
        }

        // Create new engine
        engineRef.current = new ModularVisualizationEngine(canvasRef.current, {
          onReady: (engine) => {
            setIsLoading(false);
            if (onReady) onReady(engine);
          },
          onComplete: (engine) => {
            if (onComplete) onComplete(engine);
          },
          onError: (error) => {
            console.error('Visualization error:', error);
            setError(error);
            setIsLoading(false);
          }
        });

        // Load specification
        await engineRef.current.loadFromSpec(spec);

      } catch (err) {
        console.error('Failed to initialize visualization:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    initializeVisualization();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [spec, onReady, onComplete]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        engineRef.current.resize(rect.width, rect.height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return <div className="error">Visualization Error: {error.message}</div>;
  }

  return (
    <div className={className} style={style}>
      {isLoading && <div className="loading">Loading visualization...</div>}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          width: '100%',
          height: '100%',
          display: isLoading ? 'none' : 'block'
        }}
      />
    </div>
  );
};
    `;
  },
  
  /**
   * Generate TypeScript definitions
   */
  generateTypeDefinitions: () => {
    return `
// types/modular-visualization.d.ts
export interface VisualizationSpec {
  duration?: number;
  fps?: number;
  loop?: boolean;
  autoPlay?: boolean;
  shapes: ShapeSpec[];
  animations: AnimationSpec[];
}

export interface ShapeSpec {
  id: string;
  type: 'circle' | 'arrow' | 'text' | 'line';
  properties: Record<string, any>;
  layer?: string;
}

export interface AnimationSpec {
  target: string | string[] | Record<string, any>;
  type: 'property' | 'orbit' | 'path';
  duration?: number;
  easing?: string;
  delay?: number;
  yoyo?: boolean;
  [key: string]: any;
}

export interface EngineOptions {
  fps?: number;
  duration?: number;
  loop?: boolean;
  autoPlay?: boolean;
  backgroundColor?: string;
  enableOptimization?: boolean;
  enableDirtyRegions?: boolean;
  debugMode?: boolean;
  onReady?: (engine: ModularVisualizationEngine) => void;
  onStart?: (engine: ModularVisualizationEngine) => void;
  onComplete?: (engine: ModularVisualizationEngine) => void;
  onError?: (error: Error) => void;
  onFrame?: (engine: ModularVisualizationEngine, time: number) => void;
}

export declare class ModularVisualizationEngine {
  constructor(canvas: HTMLCanvasElement, options?: EngineOptions);
  loadFromSpec(spec: VisualizationSpec): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  resize(width: number, height: number): void;
  getState(): any;
  getPerformanceStats(): any;
  exportFrame(format?: string, quality?: number): string;
  destroy(): void;
}
    `;
  }
};

// Export all examples for easy access
export default {
  basicExample,
  complexExample,
  pathExample,
  interactiveExample,
  performanceExample,
  aiIntegrationExamples,
  integrationUtils
};