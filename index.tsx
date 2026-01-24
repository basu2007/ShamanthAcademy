import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("🚀 [System] Shamanth Academy: Core Initialized.");

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Efficiently remove loading screen
    const clearOverlay = () => {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
      }
    };

    if (document.readyState === 'complete') {
      clearOverlay();
    } else {
      window.addEventListener('load', clearOverlay);
    }
    
    console.log("✅ [System] Academy Interface Ready.");
  } catch (err) {
    console.error("❌ [System] React Mount Failure:", err);
  }
} else {
  console.error("❌ [System] Critical: Root target #root not found.");
}