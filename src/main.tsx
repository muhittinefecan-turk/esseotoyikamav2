import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PWAInstallProvider } from './context/PWAInstallContext.tsx';
import './index.css';

// Purge any stale cache and update service worker
if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((k) => {
      if (k.startsWith('esse-otoyikama-v1') || k.startsWith('esse-otoyikama-v2') || k.startsWith('esse-otoyikama-v3')) {
        caches.delete(k);
      }
    });
  });
}

// Register PWA Service Worker unconditionally for full PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update();
        console.log('PWA Service Worker registered & updated:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <PWAInstallProvider>
    <App />
  </PWAInstallProvider>
);
