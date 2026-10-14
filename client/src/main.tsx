import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import { AdminPage } from './admin/AdminPage.tsx';
import { TerminalPage } from './terminal/TerminalPage.tsx';

const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isAdmin ? <AdminPage /> : <TerminalPage />}</StrictMode>,
);
