import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import OverlayScreen from './OverlayScreen';
import './overlay.css';

const params = new URLSearchParams(location.search);
const breakMinutes = Number(params.get('breakMinutes') ?? '5');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OverlayScreen breakMinutes={breakMinutes} />
  </StrictMode>
);
