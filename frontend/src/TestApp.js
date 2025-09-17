import React from 'react';

function TestApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: 'white',
      minHeight: '100vh'
    }}>
      <h1>🧬 React App is Working!</h1>
      <p>This is a test component to verify React is loading correctly.</p>
      <div style={{
        background: '#f0f8ff',
        padding: '20px',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h2>Status Check:</h2>
        <ul>
          <li>✅ React is loaded and rendering</li>
          <li>✅ Components are working</li>
          <li>✅ CSS styles are applied</li>
        </ul>
      </div>
      <button 
        onClick={() => alert('Button clicked!')}
        style={{
          padding: '12px 24px',
          background: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Test Interactivity
      </button>
    </div>
  );
}

export default TestApp;
