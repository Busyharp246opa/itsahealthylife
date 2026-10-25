import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { readLocation, replaceLocation, shellRole } from './navigation';
import './styles.css';

const CloudApp = lazy(() => import('./CloudApp'));

const role = shellRole();
const location = readLocation();
if (window.location.pathname !== (role === 'expert' ? '/experts' : `/${role}`) || location?.mode !== 'live' || location.role !== role) {
  replaceLocation({ mode: 'live', role, page: 'home' }, 0);
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><Suspense fallback={<div className="cloud-auth">Connecting to Healthy Life…</div>}><CloudApp /></Suspense></React.StrictMode>);
