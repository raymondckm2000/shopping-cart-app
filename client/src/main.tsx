import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import './index.css';

const rawBasePath =
  (import.meta.env.VITE_APP_BASE_PATH as string | undefined) ??
  import.meta.env.BASE_URL ??
  '/';

const normalizeBasePath = (path: string): string => {
  if (!path || path === '/') {
    return '/';
  }

  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailingSlash =
    withLeadingSlash.endsWith('/') && withLeadingSlash !== '/' 
      ? withLeadingSlash.slice(0, -1)
      : withLeadingSlash;

  return withoutTrailingSlash;
};

const basePath = normalizeBasePath(rawBasePath);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basePath}>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
