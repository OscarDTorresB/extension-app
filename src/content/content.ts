import { ExtensionMessage, TimerState } from '../types/index';

let overlayHost: HTMLDivElement | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function removeOverlayUI(): void {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (overlayHost) {
    overlayHost.remove();
    overlayHost = null;
  }
}

// Called by the skip button — user action that should also reschedule the work alarm
function dismissOverlay(): void {
  if (!overlayHost) return;
  removeOverlayUI();
  chrome.runtime.sendMessage({ type: 'SKIP_BREAK' });
}

// secondsLeft: current remaining seconds; total: full break duration in seconds
function showOverlay(secondsLeft: number, total: number): void {
  if (overlayHost) return;

  const gifUrl = chrome.runtime.getURL('assets/break.gif');

  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:all;';

  // Shadow DOM keeps our styles isolated from the host page's CSS
  const shadow = host.attachShadow({ mode: 'closed' });

  shadow.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      .overlay{
        position:fixed;inset:0;display:flex;align-items:center;
        justify-content:center;background:rgba(5,5,20,.92);
        backdrop-filter:blur(10px);
        font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
      }
      .card{
        display:flex;flex-direction:column;align-items:center;gap:22px;
        background:rgba(255,255,255,.06);
        border:1px solid rgba(255,255,255,.10);
        border-radius:24px;padding:48px 56px;
        max-width:520px;width:90%;text-align:center;
        backdrop-filter:blur(24px);
        box-shadow:0 24px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08);
      }
      h1{
        font-size:30px;font-weight:700;letter-spacing:-.02em;line-height:1.2;
        background:linear-gradient(135deg,#a78bfa,#67e8f9);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      }
      p{font-size:15px;color:#94a3b8;line-height:1.5;margin-top:-4px}
      img{
        width:220px;height:220px;object-fit:cover;border-radius:16px;
        box-shadow:0 0 40px rgba(124,109,250,.25),0 8px 32px rgba(0,0,0,.4);
      }
      .countdown-wrap{
        position:relative;width:100%;
        background:rgba(255,255,255,.05);
        border:1px solid rgba(255,255,255,.08);
        border-radius:12px;height:44px;overflow:hidden;
        display:flex;align-items:center;justify-content:center;
      }
      .bar{
        position:absolute;left:0;top:0;height:100%;
        background:linear-gradient(90deg,#7c6dfa,#38bdf8);
        box-shadow:0 0 16px rgba(124,109,250,.4);
        transition:width 1s linear;border-radius:12px;
      }
      .time{
        position:relative;font-size:15px;font-weight:600;
        font-variant-numeric:tabular-nums;letter-spacing:.02em;
        color:#f8fafc;z-index:1;
      }
      button{
        border:1px solid rgba(255,255,255,.15);background:transparent;
        color:#94a3b8;font-family:'Inter',sans-serif;
        font-size:13px;font-weight:600;letter-spacing:.02em;
        padding:9px 28px;border-radius:999px;
        cursor:pointer;transition:border-color .2s,color .2s,background .2s;
      }
      button:hover{
        border-color:rgba(167,139,250,.5);color:#a78bfa;
        background:rgba(124,109,250,.08);
      }
      @media(prefers-color-scheme:light){
        .overlay{background:rgba(240,240,250,.96)}
        .card{
          background:#fff;border-color:rgba(0,0,0,.08);
          box-shadow:0 24px 80px rgba(0,0,0,.12),inset 0 1px 0 rgba(0,0,0,.03);
          backdrop-filter:none;
        }
        p{color:#6b7280}
        img{box-shadow:0 0 40px rgba(124,109,250,.18),0 8px 32px rgba(0,0,0,.10)}
        .countdown-wrap{background:rgba(0,0,0,.04);border-color:rgba(0,0,0,.08)}
        .time{color:#111827}
        button{border-color:rgba(0,0,0,.14);color:#6b7280}
        button:hover{border-color:rgba(167,139,250,.5);color:#a78bfa;background:rgba(124,109,250,.08)}
      }
    </style>
    <div class="overlay">
      <div class="card">
        <h1>¡Tiempo de pausa activa!</h1>
        <p>Descansa, muévete y recarga energía.</p>
        <img src="${gifUrl}" alt="Ejercicio de pausa activa" />
        <div class="countdown-wrap">
          <div class="bar" id="bar" style="width:100%"></div>
          <span class="time" id="time">${formatTime(secondsLeft)}</span>
        </div>
        <button id="skip">Saltar pausa</button>
      </div>
    </div>
  `;

  const timeEl = shadow.getElementById('time')!;
  const barEl = shadow.getElementById('bar') as HTMLElement;
  shadow.getElementById('skip')!.addEventListener('click', dismissOverlay);

  countdownTimer = setInterval(() => {
    secondsLeft = Math.max(0, secondsLeft - 1);
    timeEl.textContent = formatTime(secondsLeft);
    barEl.style.width = `${(secondsLeft / total) * 100}%`;
    if (secondsLeft <= 0) removeOverlayUI(); // background's ALARM_BREAK handles the state transition
  }, 1000);

  document.body.appendChild(host);
  overlayHost = host;
}

// Pull state from the background and reconcile the overlay.
// Called on load and on every visibilitychange so switching tabs always shows/hides correctly.
async function syncOverlayWithState(): Promise<void> {
  if (document.hidden) return;
  try {
    const state: TimerState = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    if (state?.status === 'on_break' && state.breakStartedAt != null) {
      const elapsedSec = Math.floor((Date.now() - state.breakStartedAt) / 1000);
      const totalSec = state.breakMinutes * 60;
      const remainingSec = totalSec - elapsedSec;
      if (remainingSec > 0) {
        showOverlay(remainingSec, totalSec);
      } else {
        removeOverlayUI();
      }
    } else if (state?.status !== 'on_break') {
      removeOverlayUI();
    }
  } catch {
    // Extension context invalidated (e.g. extension reloaded) — ignore
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === 'SHOW_OVERLAY') {
    const totalSec = message.payload.breakMinutes * 60;
    showOverlay(totalSec, totalSec);
  } else if (message.type === 'DISMISS_OVERLAY') {
    removeOverlayUI();
  }
});

// Check state immediately on script load (covers newly opened / refreshed tabs)
syncOverlayWithState();
// Re-check whenever this tab becomes visible (covers tab switching)
document.addEventListener('visibilitychange', syncOverlayWithState);
