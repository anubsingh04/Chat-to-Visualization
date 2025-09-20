import React, { useRef, useEffect, useState } from 'react';
import { VisualizationEngine } from '../utils/visualizationEngine';
import './VisualizationCanvas.css';

const VisualizationCanvas = ({ visualization, onPlayStateChange }) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [isLooping, setIsLooping] = useState(true); // Enable looping by default
  const [isFullscreen, setIsFullscreen] = useState(false); // Fullscreen state
  // Debug overlay removed per request; showDebug state removed
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Track a pending visualization if it arrives before engine init
  const pendingVizRef = useRef(null);

  useEffect(() => {
    console.log('VisualizationCanvas: Initializing canvas (synchronous)...');
  const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas element not found at init');
      return () => {};
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not obtain 2D context');
      return () => {};
    }

    try {
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  canvas.style.width = canvasSize.width + 'px';
  canvas.style.height = canvasSize.height + 'px';
      engineRef.current = new VisualizationEngine(canvas, ctx);
      engineRef.current.setLoop(isLooping); 
      console.log('Engine created with looping:', isLooping);

      // If a visualization was queued, load it now
      if (pendingVizRef.current) {
        console.log('Loading pending visualization after init');
        setIsLoading(true);
        engineRef.current.loadVisualization(pendingVizRef.current);
        engineRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
        pendingVizRef.current = null;
      } else if (visualization) {
        console.log('Loading initial visualization present at mount');
        setIsLoading(true);
        engineRef.current.loadVisualization(visualization);
        engineRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
      } else {
        // No demo - wait for user to provide visualization
        console.log('Canvas ready - waiting for visualization data');
      }
    } catch (err) {
      console.error('Engine init error:', err);
      setRenderError(err.message);
    }

    return () => {
      console.log('VisualizationCanvas: Cleaning up...');
      if (engineRef.current) engineRef.current.pause();
    };
  }, [canvasSize.width, canvasSize.height]);

  // Responsive resize observer
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;
      const padding = 32; // account for padding (16px * 2)
      const border = 2; // account for border (1px * 2)
      const availableWidth = container.clientWidth - padding - border;
      const availableHeight = container.clientHeight - padding - border;
      // Maintain aspect ratio 4:3 (800x600)
      const aspect = 800 / 600;
      let width = availableWidth;
      let height = width / aspect;
      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspect;
      }
      width = Math.max(320, Math.floor(width));
      height = Math.max(240, Math.floor(height));
      setCanvasSize({ width, height });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (visualization && engineRef.current) {
      console.log('VisualizationCanvas: Received new visualization data:', visualization);
      setIsLoading(true);
      setRenderError(null);
      
      try {
        console.log('VisualizationCanvas: Loading visualization into engine...');
  engineRef.current.loadVisualization(visualization);
  setProgress(0);
  // Auto-play new visualization
  engineRef.current.play();
  setIsPlaying(true);
        
        console.log('VisualizationCanvas: Visualization loaded successfully');
        setIsLoading(false);
        
        if (onPlayStateChange) {
          onPlayStateChange(true);
        }
      } catch (error) {
        console.error('VisualizationCanvas: Error loading visualization:', error);
        setRenderError(error.message);
        setIsLoading(false);
      }
    } else if (visualization && !engineRef.current) {
      console.warn('VisualizationCanvas: Received visualization before engine init; queuing');
      pendingVizRef.current = visualization;
      setIsLoading(true); // will be cleared after init loads it
    } else {
      console.log('VisualizationCanvas: No visualization data or engine not ready');
    }
  }, [visualization, onPlayStateChange]);

  const handlePlay = () => {
    if (!engineRef.current || !visualization) {
      console.warn('Engine or visualization not ready');
      return;
    }

    try {
      // Use the new togglePlayPause method for better control
      engineRef.current.togglePlayPause();
      const newIsPlaying = engineRef.current.isPlaying;
      setIsPlaying(newIsPlaying);
      
      if (newIsPlaying) {
        // Update progress during animation
        const updateProgress = () => {
          if (engineRef.current && engineRef.current.isPlaying) {
            setProgress(engineRef.current.getProgress());
            requestAnimationFrame(updateProgress);
          }
        };
        updateProgress();
      }

      if (onPlayStateChange) {
        onPlayStateChange(newIsPlaying);
      }
    } catch (error) {
      console.error('Error controlling visualization playback:', error);
    }
  };

  const handlePause = () => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setIsPlaying(false);
    if (onPlayStateChange) onPlayStateChange(false);
  };

  const handleStop = () => {
    if (!engineRef.current) return;
    engineRef.current.stop();
    setIsPlaying(false);
    setProgress(0);
    if (onPlayStateChange) onPlayStateChange(false);
  };

  const handleLoopToggle = () => {
    const newLooping = !isLooping;
    setIsLooping(newLooping);
    if (engineRef.current) {
      engineRef.current.setLoop(newLooping);
    }
  };

  const handleFullscreenToggle = () => {
    const newFullscreen = !isFullscreen;
    setIsFullscreen(newFullscreen);
    
    if (newFullscreen) {
      // Enter fullscreen mode
      const element = canvasRef.current?.parentElement;
      if (element) {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { // Safari
          element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { // IE/Edge
          element.msRequestFullscreen();
        }
      }
    } else {
      // Exit fullscreen mode
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
      }
    }
  };

  // Listen for fullscreen change events and resize canvas
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      // Update canvas size for fullscreen
      if (isCurrentlyFullscreen) {
        setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
      } else {
        setCanvasSize({ width: 800, height: 600 });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Update canvas dimensions when canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && engineRef.current) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      canvas.style.width = canvasSize.width + 'px';
      canvas.style.height = canvasSize.height + 'px';
      
      // Re-render current frame
      if (engineRef.current.visualization) {
        engineRef.current.render();
      }
    }
  }, [canvasSize]);

  const handleReset = () => {
    if (!engineRef.current) {
      console.warn('Engine not ready for reset');
      return;
    }
    
    try {
      engineRef.current.reset();
      setIsPlaying(false);
      setProgress(0);
      
      if (onPlayStateChange) {
        onPlayStateChange(false);
      }
    } catch (error) {
      console.error('Error resetting visualization:', error);
    }
  };

  // Test function to verify canvas is working
  const handleCanvasTest = () => {
    console.log('🧪 Testing canvas rendering...');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found for test');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Context not found for test');
      return;
    }
    
    // Clear and draw test shapes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Test circle
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(100, 100, 30, 0, 2 * Math.PI);
    ctx.fill();
    
    // Test line
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 200);
    ctx.lineTo(200, 200);
    ctx.stroke();
    
    // Test text
    ctx.fillStyle = '#3498db';
    ctx.font = '16px Arial';
    ctx.fillText('Canvas Test', 50, 250);
    
    console.log('✅ Canvas test shapes drawn');
  };

  // Show error state
  if (renderError) {
    return (
      <div className="visualization-container">
        <div className="visualization-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">❌</div>
            <p>Visualization Error</p>
            <div className="error-details">
              <p>Failed to render visualization:</p>
              <code>{renderError}</code>
              <button 
                onClick={() => setRenderError(null)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="visualization-container">
      <div 
        className="canvas-wrapper" 
        style={{ 
          position: 'relative',
          width: isFullscreen ? '100vw' : 'auto',
          height: isFullscreen ? '100vh' : 'auto',
          backgroundColor: isFullscreen ? '#000' : 'transparent',
          transition: 'all 0.3s ease'
        }}
      >
        <canvas 
          ref={canvasRef} 
          className="visualization-canvas" 
          style={{
            width: isFullscreen ? '100%' : 'auto',
            height: isFullscreen ? '100%' : 'auto',
            objectFit: isFullscreen ? 'contain' : 'initial'
          }}
        />
        
        {/* Always show Play/Pause buttons when we have a visualization */}
        {visualization && (
          <div style={{ 
            position: 'fixed', 
            bottom: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 1000,
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            padding: '10px',
            borderRadius: '12px',
            backdropFilter: 'blur(5px)'
          }}>
            <button
              aria-label={isPlaying ? "Pause visualization" : "Play visualization"}
              onClick={handlePlay}
              style={{
                background: 'rgba(52, 152, 219, 0.95)',
                color: '#fff',
                border: '2px solid #fff',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(3px)',
                minWidth: '80px'
              }}
            >{isPlaying ? '⏸️ Pause' : '▶️ Play'}</button>
            
            <button
              aria-label="Stop visualization"
              onClick={handleStop}
              style={{
                background: 'rgba(231, 76, 60, 0.95)',
                color: '#fff',
                border: '2px solid #fff',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(3px)',
                minWidth: '80px'
              }}
            >⏹️ Stop</button>
            
            <button
              aria-label={isLooping ? "Disable loop" : "Enable loop"}
              onClick={handleLoopToggle}
              style={{
                background: isLooping ? 'rgba(46, 204, 113, 0.95)' : 'rgba(100, 100, 100, 0.8)',
                color: '#fff',
                border: '2px solid #fff',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(3px)',
                minWidth: '80px'
              }}
            >{isLooping ? '🔄 Loop' : '➡️ Once'}</button>
            
            <button
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={handleFullscreenToggle}
              style={{
                background: isFullscreen ? 'rgba(155, 89, 182, 0.95)' : 'rgba(52, 73, 94, 0.95)',
                color: '#fff',
                border: '2px solid #fff',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(3px)',
                minWidth: '80px'
              }}
            >{isFullscreen ? '🔍 Exit' : '🔍 Full'}</button>
          </div>
        )}
        
        {/* Debug info to help troubleshoot */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '4px 8px',
          fontSize: '12px',
          borderRadius: '4px'
        }}>
          Viz: {visualization ? 'Yes' : 'No'} | Loading: {isLoading ? 'Yes' : 'No'} | Playing: {isPlaying ? 'Yes' : 'No'}
        </div>
        {visualization && (
          <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 8 }}>
            {/* Removed duplicate overlay buttons */}
          </div>
        )}
        {(!visualization && !isLoading) && (
          <div className="visualization-placeholder" style={{ position: 'absolute', inset: 0 }}>
            <div className="placeholder-content">
              <div className="placeholder-icon">🎬</div>
              <p>Ask a scientific question to see a visualization!</p>
              <div className="example-questions">
                <p>Try asking about:</p>
                <ul>
                  <li>"Explain Newton's First Law"</li>
                  <li>"How does the Solar System work?"</li>
                  <li>"What is photosynthesis?"</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="visualization-placeholder" style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(2px)', background: 'rgba(255,255,255,0.85)' }}>
            <div className="placeholder-content">
              <div className="loading-spinner">
                <div className="spinner-circle"></div>
              </div>
              <p>Rendering visualization...</p>
              <div className="loading-details">
                <p>Processing shapes and animations</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationCanvas;


