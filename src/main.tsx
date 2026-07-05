import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA: Service Worker nur im Produktions-Build registrieren, damit der
// Dev-Server nicht aus dem Cache bedient wird.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service-Worker-Registrierung fehlgeschlagen:', error);
    });
  });
}
