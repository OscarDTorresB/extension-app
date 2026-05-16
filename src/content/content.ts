import { ExtensionMessage } from '../types/index';

let overlayHost: HTMLDivElement | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function dismissOverlay(): void {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (overlayHost) {
    overlayHost.remove();
    overlayHost = null;
    chrome.runtime.sendMessage({ type: 'SKIP_BREAK' });
  }
}

function showOverlay(breakMinutes: number): void {
  if (overlayHost) return;

  const gifUrl = chrome.runtime.getURL('assets/break.gif');
  let secondsLeft = breakMinutes * 60;
  const total = secondsLeft;

  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:all;';

  // Shadow DOM keeps our styles isolated from the host page's CSS
  const shadow = host.attachShadow({ mode: 'closed' });

  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      .overlay{
        position:fixed;inset:0;display:flex;align-items:center;
        justify-content:center;background:rgba(0,0,0,.85);
        backdrop-filter:blur(6px);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      }
      .card{
        display:flex;flex-direction:column;align-items:center;gap:20px;
        background:#fff;border-radius:20px;padding:40px 48px;
        max-width:520px;width:90%;text-align:center;
        box-shadow:0 24px 80px rgba(0,0,0,.4);
      }
      h1{font-size:26px;font-weight:700;color:#1a1a2e}
      p{font-size:15px;color:#555}
      img{width:220px;height:220px;object-fit:cover;border-radius:12px}
      .countdown-wrap{
        position:relative;width:100%;background:#eee;
        border-radius:8px;height:36px;overflow:hidden;
        display:flex;align-items:center;justify-content:center;
      }
      .bar{
        position:absolute;left:0;top:0;height:100%;
        background:linear-gradient(90deg,#6c63ff,#48c6ef);
        transition:width 1s linear;border-radius:8px;
      }
      .time{position:relative;font-size:16px;font-weight:600;color:#1a1a2e;z-index:1}
      button{
        border:2px solid #ccc;background:transparent;color:#777;
        font-size:14px;padding:8px 24px;border-radius:999px;
        cursor:pointer;transition:border-color .2s,color .2s;
      }
      button:hover{border-color:#6c63ff;color:#6c63ff}
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
    if (secondsLeft <= 0) dismissOverlay();
  }, 1000);

  document.body.appendChild(host);
  overlayHost = host;
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === 'SHOW_OVERLAY') showOverlay(message.payload.breakMinutes);
  else if (message.type === 'DISMISS_OVERLAY') dismissOverlay();
});
