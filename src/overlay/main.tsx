import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/bricolage-grotesque/500.css';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import OverlayScreen from './OverlayScreen';
import './overlay.css';

const params = new URLSearchParams(location.search);
const breakMinutes = Number(params.get('breakMinutes') ?? '5');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OverlayScreen breakMinutes={breakMinutes} />
  </StrictMode>
);
