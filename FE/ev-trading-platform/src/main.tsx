// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/main.scss';
import 'swiper/css';
import 'swiper/css/navigation';
import { startWorker } from './mocks/browser.ts';

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
 
  await startWorker();
}
 
enableMocking().then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
});