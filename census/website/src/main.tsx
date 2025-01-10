import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

import serviceWorkerUrl from '../service-worker.ts?url';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(serviceWorkerUrl);
    console.log('service worker registered');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
