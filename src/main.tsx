import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/app.css';

// Dev-only: expose store vanilla APIs on window for Playwright screenshots
if (import.meta.env.DEV) {
  import('./store/flowStore').then(m => {
    (window as any).__flowStore__ = { getState: () => m.useFlowStore.getState(), setState: m.useFlowStore.setState };
  });
  import('./store/swimlaneStore').then(m => {
    (window as any).__swimlaneStore__ = { getState: () => m.useSwimlaneStore.getState(), setState: m.useSwimlaneStore.setState };
  });
  import('./store/uiStore').then(m => {
    (window as any).__uiStore__ = { getState: () => m.useUIStore.getState(), setState: m.useUIStore.setState };
  });
  import('./store/styleStore').then(m => {
    (window as any).__styleStore__ = { getState: () => m.useStyleStore.getState(), setState: m.useStyleStore.setState };
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
