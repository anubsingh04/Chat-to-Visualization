import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Remove loading screen when React starts rendering
setTimeout(() => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => loadingScreen.remove(), 500);
  }
}, 500);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
