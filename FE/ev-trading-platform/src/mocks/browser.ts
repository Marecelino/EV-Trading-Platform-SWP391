// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export const startWorker = async () => {
  try {
    await worker.start({
      onUnhandledRequest: 'warn',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
    console.log('MSW worker started successfully');
  } catch (error) {
    console.error('Failed to start MSW worker:', error);
  }
};