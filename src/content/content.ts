import { ExtensionMessage, TimerState } from '../types/index';
import { getExerciseForBreak, formatDuration } from '../data/exercises';

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

function dismissOverlay(): void {
  if (!overlayHost) return;
  removeOverlayUI();
  chrome.runtime.sendMessage({ type: 'SKIP_BREAK' });
}

async function showOverlay(secondsLeft: number, total: number, breakMinutes: number): Promise<void> {
  if (overlayHost) return;

  const { theme } = await chrome.storage.local.get('theme');
  const isDark = (theme ?? 'dark') === 'dark';

  // Re-check after the async storage read — a concurrent call may have created the overlay
  if (overlayHost) return;

  const exercise = getExerciseForBreak(breakMinutes);
  const duration = formatDuration(exercise.durationSeconds);

  const sagePrimary   = isDark ? '#8FBC91' : '#5A7A5C';
  const terracotta    = isDark ? '#E0825A' : '#C1693A';
  const sageGlow      = isDark ? 'rgba(143,188,145,.28)' : 'rgba(90,122,92,.20)';
  const sageEmojiBg   = isDark ? 'rgba(143,188,145,.12)' : 'rgba(90,122,92,.10)';
  const overlayBg     = isDark ? 'rgba(10,9,8,.92)'      : 'rgba(245,240,232,.91)';
  const cardBg        = isDark ? 'rgba(20,18,16,.97)'    : '#FDFAF4';
  const cardBorder    = isDark ? 'rgba(245,241,234,.08)' : 'rgba(44,31,20,.10)';
  const cardShadow    = isDark
    ? '0 32px 80px rgba(0,0,0,.72),inset 0 1px 0 rgba(245,241,234,.04)'
    : '0 32px 80px rgba(44,31,20,.16),inset 0 2px 0 rgba(255,255,255,.70)';
  const textPrimary   = isDark ? '#F5F1EA' : '#2C1F14';
  const textSecondary = isDark ? '#9A958C' : '#7A6555';
  const countdownBg   = isDark ? 'rgba(245,241,234,.04)' : 'rgba(44,31,20,.05)';
  const countdownBorder = isDark ? 'rgba(245,241,234,.08)' : 'rgba(44,31,20,.10)';
  const skipBorder    = isDark ? 'rgba(245,241,234,.15)' : 'rgba(44,31,20,.18)';
  const skipColor     = isDark ? '#9A958C' : '#7A6555';

  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:all;';

  const shadow = host.attachShadow({ mode: 'closed' });

  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      .overlay{
        position:fixed;inset:0;display:flex;align-items:center;
        justify-content:center;
        background:${overlayBg};
        backdrop-filter:blur(8px);
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
      }
      .card{
        display:flex;flex-direction:column;align-items:center;gap:18px;
        background:${cardBg};
        border:1px solid ${cardBorder};
        border-radius:28px;padding:40px 48px;
        max-width:520px;width:90%;text-align:center;
        box-shadow:${cardShadow};
        animation:enter .35s cubic-bezier(.34,1.56,.64,1) both;
      }
      @keyframes enter{
        from{opacity:0;transform:scale(.96) translateY(8px)}
        to{opacity:1;transform:scale(1) translateY(0)}
      }
      .title{
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI Variable','Segoe UI',system-ui,sans-serif;
        font-size:30px;font-weight:600;letter-spacing:-.03em;line-height:1.1;
        color:${sagePrimary};
      }
      .subtitle{
        font-size:14px;color:${textSecondary};line-height:1.5;margin-top:-4px;
      }
      .exercise-card{
        display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;
      }
      .emoji-badge{
        width:72px;height:72px;border-radius:50%;
        background:${sageEmojiBg};
        display:flex;align-items:center;justify-content:center;
        font-size:34px;line-height:1;
      }
      .ex-name{
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI Variable','Segoe UI',system-ui,sans-serif;
        font-size:21px;font-weight:600;letter-spacing:-.02em;
        color:${textPrimary};line-height:1.2;
      }
      .ex-instruction{
        font-size:13px;color:${textSecondary};line-height:1.6;max-width:360px;
      }
      .ex-duration{
        display:inline-block;
        background:${isDark ? 'rgba(224,130,90,.14)' : 'rgba(193,105,58,.12)'};
        color:${terracotta};
        font-size:11px;font-weight:500;letter-spacing:.04em;
        padding:4px 12px;border-radius:20px;
      }
      .countdown-wrap{
        position:relative;width:100%;
        background:${countdownBg};
        border:1px solid ${countdownBorder};
        border-radius:16px;height:40px;overflow:hidden;
        display:flex;align-items:center;justify-content:center;
      }
      .bar{
        position:absolute;left:0;top:0;height:100%;
        background:${sagePrimary};opacity:.28;
        box-shadow:0 0 12px ${sageGlow};
        transition:width 1s linear;border-radius:16px;
      }
      .time{
        position:relative;font-size:14px;font-weight:500;
        font-variant-numeric:tabular-nums;letter-spacing:.04em;
        color:${textPrimary};z-index:1;
      }
      button{
        border:1px solid ${skipBorder};background:transparent;
        color:${skipColor};
        font-size:13px;font-weight:500;letter-spacing:.02em;
        padding:9px 28px;border-radius:14px;
        cursor:pointer;transition:border-color .2s,color .2s,background .2s;
      }
      button:hover{
        border-color:rgba(90,122,92,.50);color:${sagePrimary};
        background:rgba(90,122,92,.06);
      }
    </style>
    <div class="overlay">
      <div class="card">
        <h1 class="title">Pausa activa</h1>
        <p class="subtitle">Descansa, muévete y recarga energía.</p>
        <div class="exercise-card">
          <div class="emoji-badge">${exercise.emoji}</div>
          <p class="ex-name">${exercise.name}</p>
          <p class="ex-instruction">${exercise.instruction}</p>
          <span class="ex-duration">${duration}</span>
        </div>
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
    if (secondsLeft <= 0) removeOverlayUI();
  }, 1000);

  document.body.appendChild(host);
  overlayHost = host;
}

async function syncOverlayWithState(): Promise<void> {
  if (document.hidden) return;
  try {
    const state: TimerState = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    if (state?.status === 'on_break' && state.breakStartedAt != null) {
      const elapsedSec = Math.floor((Date.now() - state.breakStartedAt) / 1000);
      const totalSec = state.breakMinutes * 60;
      const remainingSec = totalSec - elapsedSec;
      if (remainingSec > 0) {
        showOverlay(remainingSec, totalSec, state.breakMinutes).catch(console.error);
      } else {
        removeOverlayUI();
      }
    } else if (state?.status !== 'on_break') {
      removeOverlayUI();
    }
  } catch {
    // Extension context invalidated — ignore
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === 'SHOW_OVERLAY') {
    const totalSec = message.payload.breakMinutes * 60;
    showOverlay(totalSec, totalSec, message.payload.breakMinutes).catch(console.error);
  } else if (message.type === 'DISMISS_OVERLAY') {
    removeOverlayUI();
  }
});

syncOverlayWithState();
document.addEventListener('visibilitychange', syncOverlayWithState);

// Live theme updates: if the user toggles the popup theme while a break is active,
// tear down and rebuild the overlay with the new colors.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.theme && overlayHost) {
    removeOverlayUI();
    syncOverlayWithState();
  }
});
