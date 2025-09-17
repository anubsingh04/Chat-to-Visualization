import React, { useRef, useEffect, useState } from 'react';
import { ModularVisualizationEngine } from '../utils/modular/index.js';
import './VisualizationCanvas.css';

const ModularVisualizationCanvas = ({ visualization, onPlayStateChange }) => {
  console.log('🎯 ModularVisualizationCanvas component rendering');
  
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    const initializeEngine = async () => {
      console.log('🔧 Initializing modular engine...');
      const canvas = canvasRef.current;
      
      if (!canvas) {
        console.error('❌ Canvas not found');
        return;
      }

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;
      
      // Test direct canvas drawing
      console.log('🧪 Testing direct canvas...');
      const ctx = canvas.getContext('2d');
      
      // Clear with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw red test rectangle
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(100, 100, 150, 100);
      
      // Draw blue circle
      ctx.fillStyle = '#0000ff';
      ctx.beginPath();
      ctx.arc(400, 200, 50, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = '#000000';
      ctx.font = '24px Arial';
      ctx.fillText('MODULAR SYSTEM TEST', 200, 350);
      
      console.log('✅ Direct canvas test complete');

      try {
        // Create engine
        engineRef.current = new ModularVisualizationEngine(canvas, {
          fps: 60,
          duration: 3000,
          onReady: () => {
            console.log('✅ Engine ready - loading test shapes');
            setIsLoading(false);
            
            // Load simple test
            const testSpec = {
              shapes: [
                {
                  id: 'test-circle',
                  type: 'circle',
                  properties: {
                    center: { x: 300, y: 300 },
                    radius: 40,
                    fill: '#00ff00'
                  }
                }
              ]
            };
            
            engineRef.current.loadFromSpec(testSpec).then(() => {
              console.log('✅ Test spec loaded');
              engineRef.current.render();
            });
          },
          onError: (error) => {
            console.error('❌ Engine error:', error);
            setRenderError(error.message);
          }
        });
        
      } catch (error) {
        console.error('❌ Failed to create engine:', error);
        setRenderError(error.message);
      }
    };

    initializeEngine();
  }, []);

  return (
    <div className="visualization-container">
      {/* Clear identifier */}
      <div style={{ 
        background: '#4CAF50', 
        color: 'white', 
        padding: '10px', 
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '16px'
      }}>
        🆕 MODULAR VISUALIZATION SYSTEM ACTIVE
      </div>
      
      <div className="canvas-wrapper">
        {isLoading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            Loading modular system...
          </div>
        )}
        
        {renderError && (
          <div style={{ color: 'red', padding: '20px' }}>
            Error: {renderError}
          </div>
        )}
        
        <canvas 
          ref={canvasRef}
          className="visualization-canvas"
          width={800}
          height={600}
        />
      </div>
      
      <div className="visualization-controls">
        <button onClick={() => console.log('Play clicked')}>▶️ Play</button>
        <button onClick={() => console.log('Stop clicked')}>⏹️ Stop</button>
        <div style={{ marginLeft: '20px', color: '#666' }}>
          Modular Engine Active
        </div>
      </div>
    </div>
  );
};

export default ModularVisualizationCanvas;