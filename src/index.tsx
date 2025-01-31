import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Add process polyfill for browser environment
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_SF_LOGIN_URL: process.env.REACT_APP_SF_LOGIN_URL,
      REACT_APP_SF_CLIENT_ID: process.env.REACT_APP_SF_CLIENT_ID,
      REACT_APP_SF_CLIENT_SECRET: process.env.REACT_APP_SF_CLIENT_SECRET,
      REACT_APP_SF_REDIRECT_URI: process.env.REACT_APP_SF_REDIRECT_URI,
    }
  };
}

console.log('Starting application...');
console.log('Environment:', window.process?.env);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

try {
  console.log('Rendering app...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
  root.render(
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Error Loading Application</h1>
      <p>An error occurred while loading the application. Please try refreshing the page.</p>
      <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '10px' }}>
        {error instanceof Error ? error.message : String(error)}
      </pre>
    </div>
  );
}
