import React, { useState } from 'react';
import ModularVisualizationCanvas from './ModularVisualizationCanvas';

/**
 * Demo component to test the modular system with sample visualizations
 */
const ModularDemo = () => {
  const [currentDemo, setCurrentDemo] = useState(null);
  const [selectedDemo, setSelectedDemo] = useState('');

  // Sample visualization specifications
  const demoVisualizations = {
    'simple-circle': {
      name: '🔵 Simple Circle Animation',
      spec: {
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
      }
    },

    'multi-shape': {
      name: '🎨 Multi-Shape Animation',
      spec: {
        duration: 4000,
        fps: 60,
        loop: true,
        autoPlay: true,
        shapes: [
          {
            id: 'title',
            type: 'text',
            properties: {
              position: { x: 400, y: 50 },
              text: 'Modular Demo',
              font: '24px Arial',
              fill: '#2c3e50',
              align: 'center'
            },
            layer: 'ui'
          },
          {
            id: 'circle1',
            type: 'circle',
            properties: {
              center: { x: 200, y: 200 },
              radius: 30,
              fill: '#e74c3c',
              opacity: 1
            }
          },
          {
            id: 'circle2',
            type: 'circle',
            properties: {
              center: { x: 400, y: 200 },
              radius: 30,
              fill: '#3498db',
              opacity: 1
            }
          },
          {
            id: 'arrow1',
            type: 'arrow',
            properties: {
              start: { x: 100, y: 350 },
              direction: { x: 1, y: 0 },
              length: 150,
              color: '#27ae60',
              thickness: 3
            }
          }
        ],
        animations: [
          {
            target: '#circle1',
            type: 'property',
            property: 'center.y',
            from: 200,
            to: 300,
            duration: 2000,
            easing: 'easeOutBounce',
            yoyo: true
          },
          {
            target: '#circle2',
            type: 'orbit',
            center: { x: 400, y: 250 },
            radius: 50,
            duration: 3000,
            direction: 'clockwise',
            easing: 'linear'
          },
          {
            target: '#arrow1',
            type: 'property',
            property: 'start.x',
            from: 100,
            to: 500,
            duration: 4000,
            easing: 'easeInOutCubic'
          }
        ]
      }
    },

    'orbit-demo': {
      name: '🌍 Orbital Motion',
      spec: {
        duration: 6000,
        fps: 60,
        loop: true,
        autoPlay: true,
        shapes: [
          {
            id: 'center',
            type: 'circle',
            properties: {
              center: { x: 400, y: 300 },
              radius: 15,
              fill: '#f39c12',
              opacity: 1
            },
            layer: 'center'
          },
          {
            id: 'planet1',
            type: 'circle',
            properties: {
              center: { x: 500, y: 300 },
              radius: 12,
              fill: '#3498db',
              opacity: 0.9
            }
          },
          {
            id: 'planet2',
            type: 'circle',
            properties: {
              center: { x: 400, y: 200 },
              radius: 8,
              fill: '#e74c3c',
              opacity: 0.9
            }
          },
          {
            id: 'moon',
            type: 'circle',
            properties: {
              center: { x: 520, y: 300 },
              radius: 4,
              fill: '#95a5a6',
              opacity: 0.8
            }
          }
        ],
        animations: [
          {
            target: '#planet1',
            type: 'orbit',
            center: { x: 400, y: 300 },
            radius: 100,
            duration: 4000,
            direction: 'clockwise',
            easing: 'linear'
          },
          {
            target: '#planet2',
            type: 'orbit',
            center: { x: 400, y: 300 },
            radius: 100,
            duration: 6000,
            direction: 'counterclockwise',
            easing: 'linear'
          },
          {
            target: '#moon',
            type: 'orbit',
            center: { x: 400, y: 300 },
            radius: 120,
            duration: 2000,
            direction: 'clockwise',
            easing: 'linear'
          }
        ]
      }
    }
  };

  const loadDemo = (demoKey) => {
    setSelectedDemo(demoKey);
    setCurrentDemo(demoVisualizations[demoKey]);
  };

  const clearDemo = () => {
    setCurrentDemo(null);
    setSelectedDemo('');
  };

  return (
    <div style={{ padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1>🧪 Modular Visualization System Demo</h1>
        <p>Test the new modular system with sample visualizations</p>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {Object.entries(demoVisualizations).map(([key, demo]) => (
            <button
              key={key}
              onClick={() => loadDemo(key)}
              style={{
                padding: '10px 15px',
                border: 'none',
                borderRadius: '6px',
                background: selectedDemo === key ? '#3498db' : '#ecf0f1',
                color: selectedDemo === key ? 'white' : '#2c3e50',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {demo.name}
            </button>
          ))}
          <button
            onClick={clearDemo}
            style={{
              padding: '10px 15px',
              border: 'none',
              borderRadius: '6px',
              background: '#e74c3c',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto',
        height: '600px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {currentDemo ? (
          <ModularVisualizationCanvas
            visualization={currentDemo.spec}
            onPlayStateChange={(isPlaying) => console.log('Demo playing:', isPlaying)}
          />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#7f8c8d'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎬</div>
            <h2>Select a demo above to begin</h2>
            <p>Choose from the available visualizations to test the modular system</p>
          </div>
        )}
      </div>

      {currentDemo && (
        <div style={{ 
          maxWidth: '1000px', 
          margin: '20px auto 0',
          padding: '20px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>📋 Current Visualization Specification</h3>
          <pre style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '6px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '300px',
            border: '1px solid #e9ecef'
          }}>
            {JSON.stringify(currentDemo.spec, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ModularDemo;