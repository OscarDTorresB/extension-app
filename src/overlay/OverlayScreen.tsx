import { useEffect, useState } from 'react';

interface Props {
  breakMinutes: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function dismiss(): void {
  window.parent.postMessage({ type: 'DISMISS_OVERLAY' }, '*');
}

export default function OverlayScreen({ breakMinutes }: Props) {
  const totalSeconds = breakMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const gifUrl = chrome.runtime.getURL('assets/break.gif');

  useEffect(() => {
    chrome.storage.local.get('theme', ({ theme }) => {
      document.documentElement.setAttribute('data-theme', theme ?? 'dark');
    });
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      dismiss();
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const progress = secondsLeft / totalSeconds;

  return (
    <div className="overlay">
      <div className="overlay-card">
        <h1 className="overlay-title">¡Tiempo de pausa activa!</h1>
        <p className="overlay-subtitle">
          Descansa, muévete y recarga energía.
        </p>
        <img src={gifUrl} alt="Ejercicio de pausa activa" className="overlay-gif" />
        <div className="overlay-countdown">
          <div
            className="overlay-progress-bar"
            style={{ width: `${progress * 100}%` }}
          />
          <span className="overlay-time">{formatTime(secondsLeft)}</span>
        </div>
        <button className="overlay-skip" onClick={dismiss}>
          Saltar pausa
        </button>
      </div>
    </div>
  );
}
