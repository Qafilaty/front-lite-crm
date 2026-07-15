import './sentry';
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement, {
  onUncaughtError: Sentry.reactErrorHandler((error: any, errorInfo: any) => {
    console.warn("Uncaught error", error, errorInfo?.componentStack);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
