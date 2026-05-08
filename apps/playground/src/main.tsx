import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

import { PlaygroundRoot } from './App';
import { createPersistedWindowManager } from './persistence';
import './styles.css';

function Root() {
  const manager = useMemo(() => createPersistedWindowManager(localStorage), []);

  return <PlaygroundRoot manager={manager} />;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
