// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/main.scss';
import 'swiper/css';
import 'swiper/css/navigation';

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
 
  const { worker } = await import('./mocks/browser.ts');
 
  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and running.
  return worker.start();
}
 
enableMocking().then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
});