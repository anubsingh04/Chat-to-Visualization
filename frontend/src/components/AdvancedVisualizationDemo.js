import React, { useRef, useEffect, useState } from 'react';
import { VisualizationEngine } from '../utils/visualizationEngine';

const AdvancedVisualizationDemo = () => {
  const canvasRef = useRef(null);
  const [currentDemo, setCurrentDemo] = useState('shapes');

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new VisualizationEngine(canvas, { debug: true });

    // Demo visualizations showcasing advanced shapes and animations
    const demoData = {
      shapes: {
        title: "Advanced Shapes",
        duration: 5000, // 5 second static display
        layers: [
          {
            id: 1,
            type: 'star',
            props: {
              x: 100,
              y: 100,
              outerRadius: 40,
              innerRadius: 20,
              points: 5,
              fill: '#f1c40f',
              stroke: '#f39c12'
            }
          },
          {
            id: 2,
            type: 'spiral',
            props: {
              x: 250,
              y: 100,
              maxRadius: 50,
              turns: 3,
              stroke: '#9b59b6',
              strokeWidth: 3
            }
          },
          {
            id: 3,
            type: 'wave',
            props: {
              startX: 50,
              startY: 200,
              endX: 350,
              amplitude: 30,
              frequency: 0.02,
              stroke: '#3498db',
              strokeWidth: 3
            }
          },
          {
            id: 4,
            type: 'bezier',
            props: {
              startPoint: { x: 400, y: 50 },
              controlPoint1: { x: 450, y: 20 },
              controlPoint2: { x: 500, y: 80 },
              endPoint: { x: 550, y: 50 },
              stroke: '#2ecc71',
              strokeWidth: 3
            }
          }
        ]
      },
      particles: {
        title: "Particle Effects",
        duration: 5000, // 5 second static display
        layers: [
          {
            id: 1,
            type: 'particle',
            props: {
              particles: Array.from({ length: 20 }, (_, i) => ({
                x: 300 + Math.cos(i * 0.314) * 100,
                y: 150 + Math.sin(i * 0.314) * 100,
                size: Math.random() * 5 + 2,
                opacity: Math.random() * 0.8 + 0.2,
                color: `hsl(${i * 18}, 70%, 60%)`
              }))
            }
          }
        ]
      },
      gradients: {
        title: "Gradient Shapes",
        duration: 5000, // 5 second static display
        layers: [
          {
            id: 1,
            type: 'gradient',
            props: {
              type: 'radial',
              x: 150,
              y: 150,
              radius: 80,
              shape: 'circle',
              colorStops: [
                { offset: 0, color: '#ff6b6b' },
                { offset: 0.5, color: '#4ecdc4' },
                { offset: 1, color: '#45b7d1' }
              ]
            }
          },
          {
            id: 2,
            type: 'gradient',
            props: {
              type: 'linear',
              x: 350,
              y: 100,
              width: 200,
              height: 100,
              startX: 350,
              startY: 100,
              endX: 550,
              endY: 200,
              colorStops: [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' }
              ]
            }
          }
        ]
      },
      animated: {
        title: "Animated Shapes",
        duration: 10000, // 10 second total duration for the animation sequence
        layers: [
          {
            id: 1,
            type: 'star',
            props: {
              x: 200,
              y: 150,
              outerRadius: 30,
              innerRadius: 15,
              points: 6,
              fill: '#e74c3c',
              rotation: 0
            },
            animations: [
              {
                property: 'rotation',
                startValue: 0,
                endValue: Math.PI * 2,
                duration: 3000,
                easing: 'linear',
                repeat: true
              }
            ]
          },
          {
            id: 2,
            type: 'wave',
            props: {
              startX: 50,
              startY: 250,
              endX: 550,
              amplitude: 20,
              frequency: 0.02,
              phase: 0,
              stroke: '#27ae60',
              strokeWidth: 4
            },
            animations: [
              {
                property: 'phase',
                startValue: 0,
                endValue: Math.PI * 4,
                duration: 2000,
                easing: 'linear',
                repeat: true
              }
            ]
          },
          {
            id: 3,
            type: 'circle',
            props: {
              x: 400,
              y: 100,
              r: 15,
              fill: '#8e44ad'
            },
            animations: [
              {
                property: 'r',
                startValue: 15,
                endValue: 40,
                duration: 1500,
                easing: 'easeInOutBounce',
                alternate: true,
                repeat: true
              }
            ]
          }
        ]
      },
      orbital: {
        title: "Circular & Orbital Motion",
        duration: 12000, // 12 second duration for orbital demo
        layers: [
          // Central star/sun
          {
            id: 1,
            type: 'star',
            props: {
              x: 300,
              y: 150,
              outerRadius: 20,
              innerRadius: 12,
              points: 12,
              fill: '#f39c12',
              stroke: '#f1c40f',
              rotation: 0
            },
            animations: [
              {
                property: 'rotation',
                startValue: 0,
                endValue: Math.PI * 2,
                duration: 3000,
                easing: 'linear',
                repeat: true
              }
            ]
          },
          // Inner orbiting planet (fast)
          {
            id: 2,
            type: 'circle',
            props: {
              x: 350, // Will be overridden by orbit
              y: 150,
              r: 8,
              fill: '#e74c3c'
            },
            animations: [
              {
                property: 'orbit',
                centerX: 300,
                centerY: 150,
                radius: 50,
                duration: 2000,
                repeat: true,
                easing: 'linear'
              }
            ]
          },
          // Middle orbiting planet (medium speed)
          {
            id: 3,
            type: 'circle',
            props: {
              x: 380,
              y: 150,
              r: 12,
              fill: '#3498db'
            },
            animations: [
              {
                property: 'orbit',
                centerX: 300,
                centerY: 150,
                radius: 80,
                duration: 4000,
                repeat: true,
                easing: 'linear'
              }
            ]
          },
          // Outer orbiting planet (slow)
          {
            id: 4,
            type: 'circle',
            props: {
              x: 410,
              y: 150,
              r: 10,
              fill: '#9b59b6'
            },
            animations: [
              {
                property: 'orbit',
                centerX: 300,
                centerY: 150,
                radius: 110,
                duration: 7000,
                repeat: true,
                easing: 'linear'
              }
            ]
          },
          // Spinning particle ring
          {
            id: 5,
            type: 'particle',
            props: {
              particles: Array.from({ length: 16 }, (_, i) => ({
                x: 300 + Math.cos(i * 0.393) * 140,
                y: 150 + Math.sin(i * 0.393) * 140,
                size: 3,
                opacity: 0.6,
                color: '#2ecc71'
              }))
            },
            animations: [
              {
                property: 'orbit',
                centerX: 300,
                centerY: 150,
                radius: 140,
                duration: 8000,
                repeat: true,
                easing: 'linear'
              }
            ]
          },
          // Electron-like fast orbits
          {
            id: 6,
            type: 'circle',
            props: {
              x: 320,
              y: 150,
              r: 4,
              fill: '#f1c40f',
              opacity: 0.8
            },
            animations: [
              {
                property: 'orbit',
                centerX: 300,
                centerY: 150,
                radius: 25,
                duration: 800,
                repeat: true,
                easing: 'linear'
              }
            ]
          },
          {
            id: 7,
            type: 'circle',
            props: {
              x: 300,
              y: 130,
              r: 4,
              fill: '#e67e22',
              opacity: 0.8
            },
            animations: [
              {
                property: 'orbit',
                centerX: 300,
                centerY: 150,
                radius: 25,
                duration: 900,
                repeat: true,
                easing: 'linear',
                startAngle: Math.PI / 2 // 90 degree offset
              }
            ]
          }
        ]
      }
    };

    // Render current demo
    const currentData = demoData[currentDemo];
    engine.render(currentData);
    
    // Enable looping for animated demos
    if (currentDemo === 'animated' || currentDemo === 'orbital') {
      engine.setLoop(true);
    }

    // Clean up
    return () => {
      engine.stop();
    };
  }, [currentDemo]);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>
        Advanced Visualization Engine Demo
      </h1>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {Object.keys({
          shapes: "Advanced Shapes",
          particles: "Particle Effects", 
          gradients: "Gradient Shapes",
          orbital: "Orbital Motion",
          animated: "Animated Shapes"
        }).map(key => (
          <button
            key={key}
            onClick={() => setCurrentDemo(key)}
            style={{
              padding: '10px 20px',
              backgroundColor: currentDemo === key ? '#3498db' : '#2c3e50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (currentDemo !== key) {
                e.target.style.backgroundColor = '#34495e';
              }
            }}
            onMouseLeave={(e) => {
              if (currentDemo !== key) {
                e.target.style.backgroundColor = '#2c3e50';
              }
            }}
          >
            {{
              shapes: "Advanced Shapes",
              particles: "Particle Effects", 
              gradients: "Gradient Shapes",
              orbital: "Orbital Motion",
              animated: "Animated Shapes"
            }[key]}
          </button>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          style={{
            border: '2px solid #34495e',
            borderRadius: '10px',
            backgroundColor: '#2c3e50'
          }}
        />
      </div>

      <div style={{
        textAlign: 'center',
        opacity: 0.7,
        fontSize: '14px'
      }}>
        <p>Visualization Engine Features:</p>
        <p>✨ Advanced Shapes: Stars, Spirals, Waves, Bezier Curves</p>
        <p>🎨 Gradients: Linear & Radial with color stops</p>
        <p>💫 Particle Systems: Dynamic particle effects</p>
        <p>🎬 Smooth Animations: 8 easing types with coordinate normalization</p>
        <p>📏 Auto-scaling: Handles any coordinate system from LLM</p>
      </div>
    </div>
  );
};

export default AdvancedVisualizationDemo;