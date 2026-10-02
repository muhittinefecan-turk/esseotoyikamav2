import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PWAInstallProvider } from './context/PWAInstallContext.tsx';
import './index.css';

// Register PWA Service Worker unconditionally for full PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registered successfully:', reg.scope);
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
