import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  console.error('Root element not found');
  throw new Error('Root element not found');
}

window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.log('Error: ' + msg);
  console.log('URL: ' + url);
  console.log('Line: ' + lineNo);
  console.log('Column: ' + columnNo);
  console.log('Error object: ', error);
  return false;
};

try {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
}
