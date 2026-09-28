import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { createRouter } from './router';
import './index.css';

const router = createRouter();

const rootElement = document.getElementById('root');
if (rootElement && !rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
