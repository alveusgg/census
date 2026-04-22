import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';

import * as Sentry from '@sentry/react';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');

const root = createRoot(container, {
  onRecoverableError: Sentry.reactErrorHandler()
});

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
