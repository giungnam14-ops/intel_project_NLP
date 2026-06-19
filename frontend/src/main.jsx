import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Fade out the launch splash once the app is mounted (with a brief minimum so
// it doesn't flash). Purely cosmetic — never blocks the app.
const splash = document.getElementById('splash');
if (splash) {
  window.setTimeout(() => {
    splash.classList.add('hide');
    window.setTimeout(() => splash.remove(), 450);
  }, 600);
}
